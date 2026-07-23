import { db } from "../../../db/index.js";
import { creditLots, creditLotEntries, parties } from "../../../db/schema.js";
import { eq, and, isNull, lt, gt, asc, sql } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import { getIntValue } from "../../settings/services/settings.service.js";
import type {
  CreatePartyCreditParams,
  CreditLotEntryView,
  CreditLotView,
  RefundCreditLotParams,
  SpendCreditParams,
} from "./credit.types.js";

function toLotView(l: typeof creditLots.$inferSelect): CreditLotView {
  return {
    id: l.id,
    partyId: l.partyId,
    amount: l.amount,
    remainingAmount: l.remainingAmount,
    sourceInvoiceId: l.sourceInvoiceId ?? undefined,
    decisionWindowExpiresAt: l.decisionWindowExpiresAt,
    convertedAt: l.convertedAt ?? undefined,
    createdAt: l.createdAt,
  };
}

function toEntryView(e: typeof creditLotEntries.$inferSelect): CreditLotEntryView {
  return {
    id: e.id,
    lotId: e.lotId,
    entryType: e.entryType as CreditLotEntryView["entryType"],
    amount: e.amount,
    refType: e.refType ?? undefined,
    refId: e.refId ?? undefined,
    createdAt: e.createdAt,
  };
}

// Called from M5 (payment overpayment prompt) once payments land in Sprint 4.
// One lot per overpayment event — M3: "multiple overpayments = multiple dated lots,
// each with its own window."
//
// Sprint 12 hardening: accepts an optional transaction handle (dbOrTx).
// payment.service.ts's recordPayment() was calling this as a SEPARATE
// transaction after its own payment transaction had already committed — a
// real gap: if this insert failed post-commit, the payment was recorded but
// the overpaid amount's credit lot silently never existed, i.e. money lost
// from the party's perspective. Passing the caller's own `tx` here makes
// both writes atomic (payment + credit lot commit or roll back together)
// without merging the two modules — every other caller keeps using the
// plain `db` default, unchanged.
export async function createCreditLot(
  params: CreatePartyCreditParams,
  dbOrTx: typeof db | any = db,
): Promise<CreditLotView> {
  const [party] = await dbOrTx.select().from(parties).where(eq(parties.id, params.partyId));
  if (!party) throw new Error("PARTY_NOT_FOUND");
  if (params.amount <= 0) throw new Error("INVALID_AMOUNT");

  const windowDays = await getIntValue("credit_decision_period_days", 30);
  const decisionWindowExpiresAt = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000);

  const [lot] = await dbOrTx
    .insert(creditLots)
    .values({
      partyId: params.partyId,
      amount: params.amount.toFixed(2),
      remainingAmount: params.amount.toFixed(2),
      sourceInvoiceId: params.sourceInvoiceId,
      decisionWindowExpiresAt,
    })
    .returning();

  await logAudit({
    userId: params.userId,
    action: "CREDIT_LOT_CREATED",
    entityType: "credit_lots",
    entityId: String(lot.id),
    metadata: { partyId: params.partyId, amount: params.amount },
  });

  return toLotView(lot);
}

// Derived balance — never stored. Excludes lots already converted to épargne
// (remainingAmount is zeroed at conversion, but the convertedAt filter makes the
// "never merged with other balances" rule explicit even if a future bug left a
// nonzero remainder).
export async function getPartyCreditBalance(partyId: number): Promise<number> {
  const [result] = await db
    .select({ total: sql<string>`COALESCE(SUM(${creditLots.remainingAmount}), 0)` })
    .from(creditLots)
    .where(and(eq(creditLots.partyId, partyId), isNull(creditLots.convertedAt)));
  return parseFloat(result?.total ?? "0");
}

export async function listCreditLots(partyId: number): Promise<CreditLotView[]> {
  const rows = await db
    .select()
    .from(creditLots)
    .where(eq(creditLots.partyId, partyId))
    .orderBy(asc(creditLots.createdAt));
  return rows.map(toLotView);
}

export async function listLotEntries(lotId: number): Promise<CreditLotEntryView[]> {
  const rows = await db
    .select()
    .from(creditLotEntries)
    .where(eq(creditLotEntries.lotId, lotId))
    .orderBy(asc(creditLotEntries.createdAt));
  return rows.map(toEntryView);
}

// FIFO consumption across a party's open lots — M3: "FIFO on spend."
// Partial spend reduces a lot; the remainder keeps its ORIGINAL expiry (clock
// doesn't reset — M3 edge case). Wrapped in a transaction: concurrent spends on
// the same party's credit must not double-spend the same lot balance.
export async function spendFromCredit(params: SpendCreditParams): Promise<void> {
  if (params.amount <= 0) throw new Error("INVALID_AMOUNT");

  await db.transaction(async (tx) => {
    const openLots = await tx
      .select()
      .from(creditLots)
      .where(
        and(
          eq(creditLots.partyId, params.partyId),
          isNull(creditLots.convertedAt),
          gt(creditLots.remainingAmount, "0"),
        ),
      )
      .orderBy(asc(creditLots.createdAt))
      .for("update"); // row-lock — prevents concurrent spends racing on the same lots

    let remaining = params.amount;

    for (const lot of openLots) {
      if (remaining <= 0) break;
      const lotRemaining = parseFloat(lot.remainingAmount);
      const take = Math.min(lotRemaining, remaining);
      if (take <= 0) continue;

      await tx
        .update(creditLots)
        .set({ remainingAmount: (lotRemaining - take).toFixed(2) })
        .where(eq(creditLots.id, lot.id));

      await tx.insert(creditLotEntries).values({
        lotId: lot.id,
        entryType: "spend",
        amount: take.toFixed(2),
        refType: params.refType,
        refId: params.refId,
      });

      remaining -= take;
    }

    if (remaining > 0.001) {
      throw new Error("INSUFFICIENT_CREDIT_BALANCE");
    }
  });

  await logAudit({
    userId: params.userId,
    action: "CREDIT_SPENT",
    entityType: "credit_lots",
    entityId: String(params.partyId),
    metadata: { amount: params.amount, refType: params.refType, refId: params.refId },
  });
}

// Refund = cash back on a specific lot — M3 edge case: "change given immediately is
// recorded on the payment, not a credit entry" — this function is for refunding an
// EXISTING lot balance later (client returns within the decision window), not the
// immediate-change-at-payment-time case (that's M5's concern, doesn't touch this ledger).
export async function refundCreditLot(params: RefundCreditLotParams): Promise<void> {
  if (params.amount <= 0) throw new Error("INVALID_AMOUNT");

  await db.transaction(async (tx) => {
    const [lot] = await tx
      .select()
      .from(creditLots)
      .where(eq(creditLots.id, params.lotId))
      .for("update");

    if (!lot) throw new Error("CREDIT_LOT_NOT_FOUND");
    if (lot.convertedAt) throw new Error("CREDIT_LOT_ALREADY_CONVERTED");

    const lotRemaining = parseFloat(lot.remainingAmount);
    if (params.amount > lotRemaining + 0.001) throw new Error("REFUND_EXCEEDS_LOT_BALANCE");

    await tx
      .update(creditLots)
      .set({ remainingAmount: (lotRemaining - params.amount).toFixed(2) })
      .where(eq(creditLots.id, lot.id));

    await tx.insert(creditLotEntries).values({
      lotId: lot.id,
      entryType: "refund",
      amount: params.amount.toFixed(2),
    });
  });

  await logAudit({
    userId: params.userId,
    action: "CREDIT_REFUNDED",
    entityType: "credit_lots",
    entityId: String(params.lotId),
    metadata: { amount: params.amount },
  });
}

// For the Sprint 9 auto-conversion cron (node-cron, M3+M11) — lots past their decision
// window with a remaining balance still to convert. NOT wired to épargne yet: crediting
// a savings_account, applying the inscription-fee-at-conversion rule, and the
// CREDIT_UNDERFEE_POLICY branch all require the M11 savings_accounts/savings_transactions
// tables, which don't exist until Sprint 9. This query is ready for that cron to consume.
export async function listExpiredUnconvertedLots(): Promise<CreditLotView[]> {
  const rows = await db
    .select()
    .from(creditLots)
    .where(
      and(
        lt(creditLots.decisionWindowExpiresAt, new Date()),
        isNull(creditLots.convertedAt),
        gt(creditLots.remainingAmount, "0"),
      ),
    )
    .orderBy(asc(creditLots.createdAt));
  return rows.map(toLotView);
}
