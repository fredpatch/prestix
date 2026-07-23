import { db } from "../../../db/index.js";
import { payments, installments, invoices, savingsAccounts } from "../../../db/schema.js";
import { eq, and, asc, ne, isNull, or } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import { createCreditLot } from "../../credit/services/credit.service.js";
import { recordWithdrawalInTx } from "../../savings/services/savings.service.js";
import type {
  InstallmentView,
  PaymentView,
  RecordPaymentParams,
  RescheduleParams,
} from "./payment.types.js";
import { getInstallmentPenaltyAccrued } from "@/modules/penalties/services/penalty.service.js";

function toPaymentView(p: typeof payments.$inferSelect): PaymentView {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    installmentId: p.installmentId ?? undefined,
    amountTendered: p.amountTendered,
    amountApplied: p.amountApplied,
    changeGiven: p.changeGiven,
    creditedAmount: p.creditedAmount,
    method: p.method,
    allocationTarget: p.allocationTarget ?? undefined,
    agentId: p.agentId,
    createdAt: p.createdAt,
  };
}

// Sum of amountApplied for one installment, across every payment row ever
// recorded against it — the source of truth for "how much of this échéance's
// PRINCIPAL is actually settled," never a stored counter. Explicitly excludes
// allocationTarget='penalty' rows (M6) — those settle the separate penalty
// bucket, tracked by getInstallmentPenaltyPaidAmount below, never principal.
// NOTE: `or(isNull(...), ne(...))` matters here — a plain ne() on a nullable
// column silently drops every ordinary principal payment (NULL allocationTarget)
// from the sum, since SQL `<>` never matches NULL.
async function installmentPaidAmount(tx: typeof db, installmentId: number): Promise<number> {
  const rows = await tx
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.installmentId, installmentId),
        or(isNull(payments.allocationTarget), ne(payments.allocationTarget, "penalty")),
      ),
    );
  return rows.reduce((sum, p) => sum + parseFloat(p.amountApplied), 0);
}

// M6: sum of amountApplied specifically allocated to penalty for this
// installment — the other half of the principal/penalty split.
async function installmentPenaltyPaidAmount(tx: typeof db, installmentId: number): Promise<number> {
  const rows = await tx
    .select()
    .from(payments)
    .where(
      and(eq(payments.installmentId, installmentId), eq(payments.allocationTarget, "penalty")),
    );

  return rows.reduce((sum, p) => sum + parseFloat(p.amountApplied), 0);
}

async function deriveInstallmentStatus(
  paidAmount: number,
  expectedAmount: number,
): Promise<"unpaid" | "partial" | "paid"> {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= expectedAmount - 0.01) return "paid";
  return "partial";
}

// M5: "one atomic transaction" for the whole payment event — a single cash
// handover may span multiple échéances (FIFO), each gets its own payment row,
// but they all commit together or not at all.
//
// Return shape extended (Pass 4, scenario #2) to expose becamePaid — whether
// THIS call is what tipped the invoice to fully paid — so the controller can
// fire the "invoice paid" email without a second query. Only caller today is
// payment.controller.ts#record, so widening this return type is safe.
export async function recordPayment(
  params: RecordPaymentParams,
): Promise<{ payments: PaymentView[]; becamePaid: boolean }> {
  if (params.amountTendered <= 0) throw new Error("INVALID_AMOUNT");

  const isEpargnePayment = params.method === "epargne";

  // M11: épargne balance is purely derived (no materialized counter to row-
  // lock), so protecting against a concurrent double-withdrawal here needs
  // SERIALIZABLE — same reasoning as savings.service.ts's standalone
  // recordWithdrawal. Every other payment method keeps the existing default
  // isolation level unchanged; this is scoped exclusively to the épargne case.
  const createdRows = await db.transaction(
    async (tx: any) => {
      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.id, params.invoiceId))
        .for("update");
      if (!invoice) throw new Error("INVOICE_NOT_FOUND");
      if (invoice.status !== "issued") throw new Error("INVOICE_NOT_ISSUED"); // M5: "payment only when issued"

      // M11 épargne-as-payment: the withdrawal IS the money for this payment
      // event, applied atomically alongside it — not a separate call after
      // the fact (same lesson as Sprint 7's stock-OUT-inside-issueInvoice()).
      // Checked and executed BEFORE any installment application below, since
      // if there isn't enough épargne balance, nothing about this payment
      // should proceed at all.
      if (isEpargnePayment) {
        const [account] = await tx
          .select()
          .from(savingsAccounts)
          .where(eq(savingsAccounts.partyId, invoice.partyId));
        if (!account) throw new Error("NO_EPARGNE_ACCOUNT_FOR_PARTY");

        await recordWithdrawalInTx(tx, {
          accountId: account.id,
          amount: params.amountTendered,
          agentId: params.agentId,
          appliedToInvoiceId: params.invoiceId,
        });
      }

      const allInstallments = await tx
      .select()
      .from(installments)
      .where(eq(installments.invoiceId, params.invoiceId))
      .orderBy(asc(installments.sequence))
      .for("update");

    if (allInstallments.length === 0) throw new Error("NO_PAYMENT_PLAN"); // shouldn't happen post-issue

    // Fill order: override target first (if given and still open), then the
    // rest in sequence order (FIFO) — M5: "FIFO default; agent can override."
    const ordered = params.targetInstallmentId
      ? [
          ...allInstallments.filter((i: any) => i.id === params.targetInstallmentId),
          ...allInstallments.filter((i: any) => i.id !== params.targetInstallmentId),
        ]
      : allInstallments;

    let remaining = params.amountTendered;
    const inserted: (typeof payments.$inferSelect)[] = [];

    // M6: penalty-first is a per-payment-event choice on the FIRST installment
    // in the fill order only (the targeted one, or the oldest under FIFO) —
    // it's about which bucket THIS installment's money hits first, not a
    // global override for every échéance the payment happens to reach.
    if (params.allocationTarget === "penalty" && ordered.length > 0 && remaining > 0) {
      const first = ordered[0];
      const accrued = await getInstallmentPenaltyAccrued(first.id, tx);
      const penaltyAlreadyPaid = await installmentPenaltyPaidAmount(tx, first.id);
      const penaltyDue = accrued - penaltyAlreadyPaid;

      if (penaltyDue > 0.01) {
        const appliedToPenalty = Math.min(penaltyDue, remaining);
        remaining -= appliedToPenalty;

        const [penaltyRow] = await tx
          .insert(payments)
          .values({
            invoiceId: params.invoiceId,
            installmentId: first.id,
            amountTendered: appliedToPenalty.toFixed(2),
            amountApplied: appliedToPenalty.toFixed(2),
            method: params.method,
            allocationTarget: "penalty",
            agentId: params.agentId,
          })
          .returning();
        inserted.push(penaltyRow);
        // Note: paying off penalty never changes installment.status — that
        // status tracks PRINCIPAL only (M5), penalty-first leaving principal
        // open is the whole point of this edge case.
      }
    }

    for (const inst of ordered) {
      if (remaining <= 0) break;
      const alreadyPaid = await installmentPaidAmount(tx, inst.id);
      const due = parseFloat(inst.expectedAmount) - alreadyPaid;
      if (due <= 0.01) continue; // already fully settled

      const applied = Math.min(due, remaining);
      remaining -= applied;

      const isLastRowOfThisPayment = remaining <= 0.01;
      const [row] = await tx
        .insert(payments)
        .values({
          invoiceId: params.invoiceId,
          installmentId: inst.id,
          amountTendered: applied.toFixed(2), // per-row tendered = applied; overflow goes on the final row below
          amountApplied: applied.toFixed(2),
          method: params.method,
          agentId: params.agentId,
        })
        .returning();
      inserted.push(row);

      const newPaid = alreadyPaid + applied;
      const newStatus = await deriveInstallmentStatus(newPaid, parseFloat(inst.expectedAmount));
      await tx.update(installments).set({ status: newStatus }).where(eq(installments.id, inst.id));
    }

    // M5/M3: everything still tendered after every échéance is settled is an
    // overpayment — never silently absorbed, never counted as CA.
    if (remaining > 0.01) {
      if (!params.overpaymentChoice) throw new Error("OVERPAYMENT_CHOICE_REQUIRED");

      const [lastRow] = inserted.length > 0 ? [inserted[inserted.length - 1]] : [];
      if (!lastRow) throw new Error("OVERPAYMENT_WITH_NOTHING_DUE"); // invoice was already fully paid

      if (params.overpaymentChoice === "change") {
        await tx
          .update(payments)
          .set({ changeGiven: remaining.toFixed(2) })
          .where(eq(payments.id, lastRow.id));
      } else {
        await tx
          .update(payments)
          .set({ creditedAmount: remaining.toFixed(2) })
          .where(eq(payments.id, lastRow.id));
        // credit lot creation happens after the transaction commits (needs its
        // own transaction; see below)
      }
    }

    // Recompute invoice-level payment status from the fresh installment states
    const freshInstallments = await tx
      .select()
      .from(installments)
      .where(eq(installments.invoiceId, params.invoiceId));
    const allPaid = freshInstallments.every((i: any) => i.status === "paid");
    const anyProgress = freshInstallments.some((i: any) => i.status !== "unpaid");
    const paymentStatus = allPaid ? "paid" : anyProgress ? "partial" : "unpaid";
    await tx.update(invoices).set({ paymentStatus }).where(eq(invoices.id, params.invoiceId));

    // becamePaid: this call is the one that tipped the invoice from
    // not-paid to paid — the trigger condition for the "invoice paid" email
    // (scenario #2, full-payment only per scope). Comparing against the
    // pre-transaction snapshot (not just "paymentStatus === paid") avoids
    // re-firing the email on any later, unrelated write against an invoice
    // that was already fully settled.
    const becamePaid = invoice.paymentStatus !== "paid" && paymentStatus === "paid";

    // Sprint 12 hardening: credit-lot creation now happens INSIDE this same
    // transaction (passing `tx`), not as a separate call after commit. If
    // the overpayment can't be recorded as a credit lot, the whole payment
    // rolls back too — no more window where a payment is recorded but its
    // overpaid amount silently has no corresponding credit lot. `invoice`
    // (selected with `.for("update")` above) already has `partyId`, so no
    // extra query is needed here.
    const overpaidToCredit =
      remaining > 0.01 && params.overpaymentChoice === "credit" ? remaining : 0;
    if (overpaidToCredit > 0) {
      await createCreditLot(
        {
          partyId: invoice.partyId,
          amount: overpaidToCredit,
          sourceInvoiceId: params.invoiceId,
          userId: params.agentId,
        },
        tx,
      );
    }

    return {
      inserted,
      overpaidToCredit,
      becamePaid,
    };
    },
    isEpargnePayment ? { isolationLevel: "serializable" } : undefined,
  );

  await logAudit({
    userId: params.agentId,
    action: "PAYMENT_RECORDED",
    entityType: "invoices",
    entityId: String(params.invoiceId),
    metadata: {
      amountTendered: params.amountTendered,
      method: params.method,
      rowCount: createdRows.inserted.length,
    },
  });

  return {
    payments: createdRows.inserted.map(toPaymentView),
    becamePaid: createdRows.becamePaid,
  };
}

export async function listPaymentsByInvoice(invoiceId: number): Promise<PaymentView[]> {
  const rows = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  return rows.map(toPaymentView);
}

export async function listInstallmentsByInvoice(invoiceId: number): Promise<InstallmentView[]> {
  const rows = await db
    .select()
    .from(installments)
    .where(eq(installments.invoiceId, invoiceId))
    .orderBy(asc(installments.sequence));

  const results: InstallmentView[] = [];
  for (const inst of rows) {
    const paidAmount = await installmentPaidAmount(db, inst.id);
    const penaltyAccrued = await getInstallmentPenaltyAccrued(inst.id);
    const penaltyPaid = await installmentPenaltyPaidAmount(db, inst.id);

    results.push({
      id: inst.id,
      invoiceId: inst.invoiceId,
      sequence: inst.sequence,
      expectedDate: inst.expectedDate,
      expectedAmount: inst.expectedAmount,
      paidAmount: paidAmount.toFixed(2),
      status: inst.status,
      penaltyAccrued: penaltyAccrued.toFixed(2),
      penaltyPaid: penaltyPaid.toFixed(2),
      penaltyDue: Math.max(0, penaltyAccrued - penaltyPaid).toFixed(2),
      rescheduledFrom: inst.rescheduledFrom ?? undefined,
      rescheduledReason: inst.rescheduledReason ?? undefined,
    });
  }
  return results;
}

// M5: privileged admin+, reason required, audited, forward-only. Accrued
// penalties (M6, Sprint 5) stay locked — only the future accrual clock moves;
// no interaction needed here yet since penalties don't exist.
export async function rescheduleInstallment(params: RescheduleParams): Promise<InstallmentView> {
  if (!params.reason?.trim()) throw new Error("RESCHEDULE_REASON_REQUIRED");

  const [inst] = await db
    .select()
    .from(installments)
    .where(eq(installments.id, params.installmentId));
  if (!inst) throw new Error("INSTALLMENT_NOT_FOUND");
  if (inst.status === "paid") throw new Error("CANNOT_RESCHEDULE_PAID_INSTALLMENT");

  const newDate = new Date(params.newDate);
  const currentDate = new Date(inst.expectedDate);
  if (newDate <= currentDate) throw new Error("RESCHEDULE_MUST_BE_FORWARD_ONLY");

  const [updated] = await db
    .update(installments)
    .set({
      expectedDate: params.newDate,
      rescheduledFrom: inst.expectedDate,
      rescheduledBy: params.userId,
      rescheduledReason: params.reason,
    })
    .where(eq(installments.id, params.installmentId))
    .returning();

  // If this was the last échéance, the invoice's final due date also moves (M5:
  // "invoice final due date = last échéance").
  const siblings = await db
    .select()
    .from(installments)
    .where(eq(installments.invoiceId, inst.invoiceId));
  const isLast = Math.max(...siblings.map((s) => s.sequence)) === inst.sequence;
  if (isLast) {
    await db
      .update(invoices)
      .set({ dueDate: params.newDate })
      .where(eq(invoices.id, inst.invoiceId));
  }

  await logAudit({
    userId: params.userId,
    action: "INSTALLMENT_RESCHEDULED",
    entityType: "installments",
    entityId: String(updated.id),
    metadata: { from: inst.expectedDate, to: params.newDate, reason: params.reason },
  });

  const paidAmount = await installmentPaidAmount(db, updated.id);
  const penaltyAccrued = await getInstallmentPenaltyAccrued(updated.id);
  const penaltyPaid = await installmentPenaltyPaidAmount(db, updated.id);

  return {
    id: updated.id,
    invoiceId: updated.invoiceId,
    sequence: updated.sequence,
    expectedDate: updated.expectedDate,
    expectedAmount: updated.expectedAmount,
    paidAmount: paidAmount.toFixed(2),
    status: updated.status,
    penaltyAccrued: penaltyAccrued.toFixed(2),
    penaltyPaid: penaltyPaid.toFixed(2),
    penaltyDue: Math.max(0, penaltyAccrued - penaltyPaid).toFixed(2),
    rescheduledFrom: updated.rescheduledFrom ?? undefined,
    rescheduledReason: updated.rescheduledReason ?? undefined,
  };
}
