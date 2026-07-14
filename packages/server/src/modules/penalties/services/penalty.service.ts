import { db } from "../../../db/index.js";
import { penalties, installments, invoices } from "../../../db/schema.js";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { getIntValue } from "../../settings/services/settings.service.js";
import { logAudit } from "../../auth/services/auth.service.js";
import type { PenaltyView } from "./penalty.types.js";

type PenaltyReadDb = Pick<typeof db, "select">;

// M6: flat 2500/week per échéance, accumulating, never proportional. Named
// constants per spec — "back these rules with named constants, not magic numbers."
const PENALTY_ACCRUAL_PERIOD_DAYS = 7; // one full week
const DEFAULT_PENALTY_AMOUNT_XAF = 2500;
const DEFAULT_PENALTY_GRACE_DAYS = 7;

// Pure, DB-free — the exact rule under test: how many weekly penalty rows
// SHOULD exist for an échéance by `today`, given when it was due and the
// grace period. Extracted specifically so this can be unit-tested without a
// database — this is the one calculation that must never silently drift.
export function computeExpectedAccrualCount(
  expectedDate: Date,
  graceWeeks: number,
  today: Date,
): number {
  const anchor = new Date(expectedDate);
  anchor.setHours(0, 0, 0, 0);
  anchor.setDate(anchor.getDate() + graceWeeks * PENALTY_ACCRUAL_PERIOD_DAYS);

  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  if (normalizedToday < anchor) return 0;

  const daysSinceAnchor = Math.floor(
    (normalizedToday.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.floor(daysSinceAnchor / PENALTY_ACCRUAL_PERIOD_DAYS) + 1;
}

function toView(p: typeof penalties.$inferSelect): PenaltyView {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    installmentId: p.installmentId,
    amountXaf: p.amountXaf,
    graceWeeks: p.graceWeeks,
    accruedAt: p.accruedAt,
    voidedAt: p.voidedAt ?? undefined,
    voidedReason: p.voidedReason ?? undefined,
  };
}

// Settings store grace in DAYS (penalty_grace_days); the penalties.graceWeeks
// column is typed in WEEKS since the whole rule is "N full weeks late." Rounded
// to the nearest week — exact for the default (7 days = 1 week), reasonable for
// any future value since the rule only makes sense in week-multiples anyway.
async function getCurrentPenaltyRateWeeks(): Promise<{ amountXaf: number; graceWeeks: number }> {
  const amountXaf = await getIntValue("penalty_amount_xaf", DEFAULT_PENALTY_AMOUNT_XAF);
  const graceDays = await getIntValue("penalty_grace_days", DEFAULT_PENALTY_GRACE_DAYS);
  const graceWeeks = Math.max(1, Math.round(graceDays / PENALTY_ACCRUAL_PERIOD_DAYS));
  return { amountXaf, graceWeeks };
}

// The daily cron body (M6): +2500/week per overdue échéance, parallel and
// independent, accrues until that specific échéance is fully settled — partial
// payment never stops it. No manual waiver anywhere in this function; voiding
// only happens via invoice cancellation (voidPenaltiesForInvoice below).
export async function accrueOverduePenalties(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only installments on ISSUED invoices, not yet fully paid, ever accrue.
  const candidates = await db
    .select({ installment: installments, invoice: invoices })
    .from(installments)
    .innerJoin(invoices, eq(installments.invoiceId, invoices.id))
    .where(and(eq(invoices.status, "issued"), inArray(installments.status, ["unpaid", "partial"])));

  let inserted = 0;

  for (const { installment } of candidates) {
    const existingRows = await db
      .select()
      .from(penalties)
      .where(and(eq(penalties.installmentId, installment.id), isNull(penalties.voidedAt)));

    // Anchor uses the grace snapshotted on this installment's FIRST-ever row if
    // one exists (so the anchor date never silently shifts if settings change
    // mid-stream); otherwise reads the current settings value for a brand-new
    // overdue installment.
    let graceWeeks: number;
    let amountXaf: number;
    if (existingRows.length > 0) {
      graceWeeks = existingRows[0].graceWeeks;
      amountXaf = await getIntValue("penalty_amount_xaf", DEFAULT_PENALTY_AMOUNT_XAF); // amount CAN change per new accrual
    } else {
      const rates = await getCurrentPenaltyRateWeeks();
      graceWeeks = rates.graceWeeks;
      amountXaf = rates.amountXaf;
    }

    const weeksThatShouldHaveAccrued = computeExpectedAccrualCount(
      new Date(installment.expectedDate),
      graceWeeks,
      today,
    );

    const missing = weeksThatShouldHaveAccrued - existingRows.length;

    if (missing <= 0) continue; // already caught up (cron ran today already, or nothing new)

    for (let i = 0; i < missing; i++) {
      await db.insert(penalties).values({
        invoiceId: installment.invoiceId,
        installmentId: installment.id,
        amountXaf: amountXaf.toFixed(2),
        graceWeeks,
      });
      inserted++;
    }
  }

  return inserted;
}

export async function getInstallmentPenaltyAccrued(
  installmentId: number,
  queryDb: PenaltyReadDb = db,
): Promise<number> {
  const rows = await queryDb
    .select()
    .from(penalties)
    .where(and(eq(penalties.installmentId, installmentId), isNull(penalties.voidedAt)));
  return rows.reduce((sum, p) => sum + parseFloat(p.amountXaf), 0);
}

export async function listPenaltiesForInvoice(invoiceId: number): Promise<PenaltyView[]> {
  const rows = await db.select().from(penalties).where(eq(penalties.invoiceId, invoiceId));
  return rows.map(toView);
}

// M4/M6: cancellation voids every non-voided penalty row on the invoice —
// audited, no other path can waive a penalty (spec: "no manual waiver").
export async function voidPenaltiesForInvoice(
  invoiceId: number,
  reason: string,
  userId: number,
): Promise<number> {
  const rows = await db
    .select()
    .from(penalties)
    .where(and(eq(penalties.invoiceId, invoiceId), isNull(penalties.voidedAt)));

  if (rows.length === 0) return 0;

  await db
    .update(penalties)
    .set({ voidedAt: new Date(), voidedReason: reason })
    .where(and(eq(penalties.invoiceId, invoiceId), isNull(penalties.voidedAt)));

  await logAudit({
    userId,
    action: "PENALTIES_VOIDED",
    entityType: "invoices",
    entityId: String(invoiceId),
    metadata: { count: rows.length, reason },
  });

  return rows.length;
}
