import { db } from "../../../db/index.js";
import { savingsAccounts, savingsTransactions, parties } from "../../../db/schema.js";
import { eq, and, isNull, sql } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import { getIntValue } from "../../settings/services/settings.service.js";
import { getNextNumber } from "../../documents/services/counters.service.js";
import type {
  CreateDirectSubscriptionParams,
  RecordDepositParams,
  RecordWithdrawalParams,
  ReverseTransactionParams,
  SavingsAccountView,
  SavingsTransactionView,
} from "./savings.types.js";

const CURRENCY = "XAF"; // V1 is XAF-only; column kept on the schema for later per spec

function toTransactionView(row: typeof savingsTransactions.$inferSelect): SavingsTransactionView {
  return {
    id: row.id,
    accountId: row.accountId,
    nature: row.nature,
    amount: row.amount,
    quantity: row.quantity,
    totalAmount: row.totalAmount,
    status: row.status,
    appliedToInvoiceId: row.appliedToInvoiceId ?? undefined,
    receiptNumber: row.receiptNumber ?? undefined,
    reversalOfTransactionId: row.reversalOfTransactionId ?? undefined,
    agentId: row.agentId ?? undefined,
    recordedAt: row.recordedAt ?? undefined,
    createdAt: row.createdAt,
  };
}

// The one balance-computation function in the whole module — every other
// function that needs a balance calls THIS, never re-derives it inline.
// Only `recorded` rows count; a `draft` row (if one ever exists) is not yet
// real money moved.
async function computeBalance(executor: typeof db, accountId: number): Promise<number> {
  const rows = await executor
    .select()
    .from(savingsTransactions)
    .where(and(eq(savingsTransactions.accountId, accountId), eq(savingsTransactions.status, "recorded")));

  return rows.reduce((sum, r) => {
    const amount = parseFloat(r.totalAmount);
    return r.nature === "deposit" ? sum + amount : sum - amount;
  }, 0);
}

async function toAccountView(row: typeof savingsAccounts.$inferSelect): Promise<SavingsAccountView> {
  const balance = await computeBalance(db, row.id);
  return {
    id: row.id,
    partyId: row.partyId,
    currency: row.currency,
    inscriptionFeeAmount: row.inscriptionFeeAmount,
    subscriptionSource: row.subscriptionSource as "direct" | "credit_conversion",
    sourceCreditLotId: row.sourceCreditLotId ?? undefined,
    balance: balance.toFixed(2),
    createdAt: row.createdAt,
  };
}

export async function getAccountByParty(partyId: number): Promise<SavingsAccountView | null> {
  const [row] = await db
    .select()
    .from(savingsAccounts)
    .where(and(eq(savingsAccounts.partyId, partyId), eq(savingsAccounts.currency, CURRENCY)));
  return row ? toAccountView(row) : null;
}

export async function getAccountById(id: number): Promise<SavingsAccountView> {
  const [row] = await db.select().from(savingsAccounts).where(eq(savingsAccounts.id, id));
  if (!row) throw new Error("SAVINGS_ACCOUNT_NOT_FOUND");
  return toAccountView(row);
}

// The "direct" subscription path — client pays the inscription fee out of
// pocket at the counter, account opens immediately. The fee amount is
// snapshotted onto the account row at the moment of subscription (spec:
// "fee amount snapshotted"), so a later change to the epargne_inscription_fee
// setting never retroactively alters what THIS client actually paid.
export async function createDirectSubscription(
  params: CreateDirectSubscriptionParams,
): Promise<SavingsAccountView> {
  const [party] = await db.select().from(parties).where(eq(parties.id, params.partyId));
  if (!party) throw new Error("PARTY_NOT_FOUND");

  const existing = await getAccountByParty(params.partyId);
  if (existing) throw new Error("SAVINGS_ACCOUNT_ALREADY_EXISTS"); // one account per party/currency — duplicate subscription blocked

  const feeAmount = await getIntValue("epargne_inscription_fee", 5000);

  // The fee is real money changing hands, so it gets a real, visible trail in
  // the ledger — not just a number snapshotted on the account row. Recorded
  // as a deposit immediately offset by a withdrawal of the same amount, both
  // inside the SAME transaction as opening the account: nets to zero balance
  // (the fee is agency revenue, not the client's own money), but anyone
  // looking at this party's history sees exactly what happened, not an
  // invisible number. The offsetting withdrawal here does NOT go through the
  // manager+/admin+ gate — it's the same collection event as the deposit
  // beside it, not an agent independently requesting money out.
  const account = await db.transaction(async (tx: any) => {
    const [inserted] = await tx
      .insert(savingsAccounts)
      .values({
        partyId: params.partyId,
        currency: CURRENCY,
        inscriptionFeeAmount: feeAmount.toFixed(2),
        subscriptionSource: "direct",
      })
      .returning();

    const now = new Date();
    await tx.insert(savingsTransactions).values({
      accountId: inserted.id,
      nature: "deposit",
      amount: feeAmount.toFixed(2),
      quantity: 1,
      totalAmount: feeAmount.toFixed(2),
      status: "recorded",
      agentId: params.agentId,
      recordedAt: now,
    });
    await tx.insert(savingsTransactions).values({
      accountId: inserted.id,
      nature: "withdraw",
      amount: feeAmount.toFixed(2),
      quantity: 1,
      totalAmount: feeAmount.toFixed(2),
      status: "recorded",
      agentId: params.agentId,
      recordedAt: now,
    });

    return inserted;
  });

  await logAudit({
    userId: params.agentId,
    action: "SAVINGS_ACCOUNT_OPENED",
    entityType: "savings_accounts",
    entityId: String(account.id),
    metadata: { partyId: params.partyId, entryPath: "direct", feeAmount },
  });

  return toAccountView(account);
}

// Deposits are unrestricted (any amount, any agent) — the guard that matters
// is on withdrawals, not deposits. Created directly as `recorded`; there's no
// meaningful agent-facing "draft" step for a deposit (unlike invoices, where
// draft exists so lines can be assembled before commitment — a deposit is a
// single atomic fact: money was handed over, right now, for this amount).
export async function recordDeposit(params: RecordDepositParams): Promise<SavingsTransactionView> {
  if (params.amount <= 0) throw new Error("SAVINGS_AMOUNT_MUST_BE_POSITIVE");
  const quantity = params.quantity ?? 1;

  const [inserted] = await db
    .insert(savingsTransactions)
    .values({
      accountId: params.accountId,
      nature: "deposit",
      amount: params.amount.toFixed(2),
      quantity,
      totalAmount: (params.amount * quantity).toFixed(2),
      status: "recorded",
      agentId: params.agentId,
      recordedAt: new Date(),
    })
    .returning();

  await logAudit({
    userId: params.agentId,
    action: "SAVINGS_DEPOSIT_RECORDED",
    entityType: "savings_transactions",
    entityId: String(inserted.id),
    metadata: { accountId: params.accountId, totalAmount: params.amount * quantity },
  });

  return toTransactionView(inserted);
}

// THE guarded function — withdrawal (standalone). Runs the balance check and
// the insert inside a SERIALIZABLE transaction: since balance here is purely
// derived (no materialized counter to .for('update') lock, unlike stock's
// onHand), SERIALIZABLE is what actually protects against two concurrent
// withdrawals both reading a stale balance and both succeeding when only one
// should. Postgres aborts the loser with a serialization failure; this
// function does NOT auto-retry that — a real contention scenario here would
// be rare (manager+ gated, not a high-frequency action), so a clean error
// surfaced to the UI is an acceptable tradeoff for not building a retry loop.
export async function recordWithdrawal(params: RecordWithdrawalParams): Promise<SavingsTransactionView> {
  if (params.amount <= 0) throw new Error("SAVINGS_AMOUNT_MUST_BE_POSITIVE");
  const quantity = params.quantity ?? 1;
  const totalAmount = params.amount * quantity;

  const result = await db.transaction(
    async (tx: any) => {
      const balance = await computeBalance(tx, params.accountId);
      if (totalAmount > balance) throw new Error("INSUFFICIENT_EPARGNE_BALANCE");

      // Only a standalone withdrawal gets its own receipt number — one applied
      // as an épargne-as-payment (Sprint 4 integration) is still a real
      // withdrawal but its "receipt" is the invoice payment itself, not a
      // separate slip.
      const receiptNumber = params.appliedToInvoiceId ? undefined : await getNextNumber(tx, "REC");

      const [inserted] = await tx
        .insert(savingsTransactions)
        .values({
          accountId: params.accountId,
          nature: "withdraw",
          amount: params.amount.toFixed(2),
          quantity,
          totalAmount: totalAmount.toFixed(2),
          status: "recorded",
          appliedToInvoiceId: params.appliedToInvoiceId,
          receiptNumber,
          agentId: params.agentId,
          recordedAt: new Date(),
        })
        .returning();

      return inserted;
    },
    { isolationLevel: "serializable" },
  );

  await logAudit({
    userId: params.agentId,
    action: "SAVINGS_WITHDRAWAL_RECORDED",
    entityType: "savings_transactions",
    entityId: String(result.id),
    metadata: { accountId: params.accountId, totalAmount, appliedToInvoiceId: params.appliedToInvoiceId },
  });

  return toTransactionView(result);
}

// Transaction-participating twin of recordWithdrawal — for the épargne-as-
// payment integration (Sprint 4's recordPayment), which needs this withdrawal
// to commit atomically alongside the payment row itself, same lesson learned
// from Sprint 7's stock-movement-inside-issueInvoice() work. NOTE: this one
// can't itself request SERIALIZABLE isolation (that's set once, for the
// whole outer transaction, by whoever opens it) — payment.service.ts is
// responsible for opening its transaction at the right isolation level when
// method === 'epargne'.
export async function recordWithdrawalInTx(
  tx: typeof db,
  params: RecordWithdrawalParams,
): Promise<SavingsTransactionView> {
  const quantity = params.quantity ?? 1;
  const totalAmount = params.amount * quantity;

  const balance = await computeBalance(tx, params.accountId);
  if (totalAmount > balance) throw new Error("INSUFFICIENT_EPARGNE_BALANCE");

  const [inserted] = await tx
    .insert(savingsTransactions)
    .values({
      accountId: params.accountId,
      nature: "withdraw",
      amount: params.amount.toFixed(2),
      quantity,
      totalAmount: totalAmount.toFixed(2),
      status: "recorded",
      appliedToInvoiceId: params.appliedToInvoiceId,
      agentId: params.agentId,
      recordedAt: new Date(),
    })
    .returning();

  return toTransactionView(inserted);
}

// Reversal — the ONLY correction mechanism for a recorded transaction (spec:
// "recorded transaction is immutable; correction only via reversal entry").
// Creates a compensating entry in the OPPOSITE direction rather than editing
// or deleting the original — the original stays exactly as it was, forever,
// and the reversal is its own auditable row linked back via
// reversalOfTransactionId. admin+ gated at the route level, reason required.
export async function reverseTransaction(
  params: ReverseTransactionParams,
): Promise<SavingsTransactionView> {
  if (!params.reason?.trim()) throw new Error("REVERSAL_REASON_REQUIRED");

  const [original] = await db
    .select()
    .from(savingsTransactions)
    .where(eq(savingsTransactions.id, params.transactionId));
  if (!original) throw new Error("SAVINGS_TRANSACTION_NOT_FOUND");
  if (original.status !== "recorded") throw new Error("ONLY_RECORDED_TRANSACTIONS_CAN_BE_REVERSED");

  const alreadyReversed = await db
    .select()
    .from(savingsTransactions)
    .where(eq(savingsTransactions.reversalOfTransactionId, original.id));
  if (alreadyReversed.length > 0) throw new Error("TRANSACTION_ALREADY_REVERSED");

  const opposingNature = original.nature === "deposit" ? "withdraw" : "deposit";

  // A reversal of a withdrawal (opposing nature = deposit) never needs a
  // balance check — depositing money back can't push a balance negative. A
  // reversal of a deposit (opposing nature = withdraw) DOES need the same
  // guard as any other withdrawal, wrapped the same way.
  const result = await db.transaction(
    async (tx: any) => {
      if (opposingNature === "withdraw") {
        const balance = await computeBalance(tx, original.accountId);
        if (parseFloat(original.totalAmount) > balance) throw new Error("INSUFFICIENT_EPARGNE_BALANCE");
      }

      const [inserted] = await tx
        .insert(savingsTransactions)
        .values({
          accountId: original.accountId,
          nature: opposingNature,
          amount: original.amount,
          quantity: original.quantity,
          totalAmount: original.totalAmount,
          status: "recorded",
          reversalOfTransactionId: original.id,
          agentId: params.userId,
          recordedAt: new Date(),
        })
        .returning();

      return inserted;
    },
    { isolationLevel: "serializable" },
  );

  await logAudit({
    userId: params.userId,
    action: "SAVINGS_TRANSACTION_REVERSED",
    entityType: "savings_transactions",
    entityId: String(result.id),
    metadata: { originalTransactionId: original.id, reason: params.reason },
  });

  return toTransactionView(result);
}

export async function listTransactionsForAccount(accountId: number): Promise<SavingsTransactionView[]> {
  const rows = await db
    .select()
    .from(savingsTransactions)
    .where(eq(savingsTransactions.accountId, accountId))
    .orderBy(sql`${savingsTransactions.createdAt} desc`);
  return rows.map(toTransactionView);
}
