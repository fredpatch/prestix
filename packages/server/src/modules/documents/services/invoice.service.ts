import { db } from "../../../db/index.js";
import {
  invoices,
  invoiceLines,
  proformas,
  proformaLines,
  parties,
  roleLevel,
  users,
  installments,
  payments,
} from "../../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import { getNextNumber } from "./counters.service.js";
import { getIntValue } from "../../settings/services/settings.service.js";
import { createCreditLot } from "../../credit/services/credit.service.js";
import type {
  CancelInvoiceParams,
  CreateDraftInvoiceParams,
  InvoiceView,
  IssueInvoiceParams,
} from "./invoice.types.js";

function lineTotal(unitPrice: number, quantity: number, discount: number): number {
  return unitPrice * quantity - discount;
}

// M7: discounts are manager only. Cheap to enforce now even though the full
// discount workflow (bounds, print summary) is Sprint 6 scope.
async function assertCanDiscount(userId: number, lines: { discount?: number }[]): Promise<void> {
  const hasDiscount = lines.some((l) => (l.discount ?? 0) > 0);
  if (!hasDiscount) return;
  const [actor] = await db.select().from(users).where(eq(users.id, userId));
  if (!actor || roleLevel[actor.role] < roleLevel.manager) {
    throw new Error("DISCOUNT_REQUIRES_MANAGER");
  }
}

async function toView(
  inv: typeof invoices.$inferSelect,
  lines: (typeof invoiceLines.$inferSelect)[],
): Promise<InvoiceView> {
  return {
    id: inv.id,
    number: inv.number ?? undefined,
    proformaId: inv.proformaId ?? undefined,
    partyId: inv.partyId,
    referrerPartyId: inv.referrerPartyId ?? undefined,
    partySnapshot: inv.partySnapshot as Record<string, unknown>,
    status: inv.status,
    paymentStatus: inv.paymentStatus,
    totalAmount: inv.totalAmount,
    totalDiscount: inv.totalDiscount,
    dueDate: inv.dueDate ?? undefined,
    issuedAt: inv.issuedAt ?? undefined,
    cancelledAt: inv.cancelledAt ?? undefined,
    cancelReason: inv.cancelReason ?? undefined,
    createdAt: inv.createdAt,
    lines: lines.map((l) => ({
      id: l.id,
      lineType: l.lineType,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      lineTotal: l.lineTotal,
    })),
  };
}

async function recomputeInvoiceTotals(tx: typeof db, invoiceId: number): Promise<void> {
  const lines = await tx.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId));
  const totalAmount = lines.reduce((sum, l) => sum + parseFloat(l.lineTotal), 0);
  const totalDiscount = lines.reduce((sum, l) => sum + parseFloat(l.discount), 0);
  await tx
    .update(invoices)
    .set({ totalAmount: totalAmount.toFixed(2), totalDiscount: totalDiscount.toFixed(2) })
    .where(eq(invoices.id, invoiceId));
}

async function assertDraft(invoiceId: number): Promise<typeof invoices.$inferSelect> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!inv) throw new Error("INVOICE_NOT_FOUND");
  if (inv.status !== "draft") throw new Error("INVOICE_NOT_DRAFT"); // M4: draft-only mutations
  return inv;
}

// Direct draft creation — M4: "an invoice can be created directly as a draft" (proforma optional).
export async function createDraftInvoice(params: CreateDraftInvoiceParams): Promise<InvoiceView> {
  if (params.lines.length === 0) throw new Error("INVOICE_NEEDS_AT_LEAST_ONE_LINE");

  // M7: discounts are manager-only. Cheap to enforce now even though the full
  // discount workflow (bounds, print summary) is Sprint 6 scope.
  await assertCanDiscount(params.createdByUserId, params.lines);

  const [party] = await db.select().from(parties).where(eq(parties.id, params.partyId));
  if (!party) throw new Error("PARTY_NOT_FOUND");

  const result = await db.transaction(async (tx: any) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        partyId: params.partyId,
        referrerPartyId: params.referrerPartyId,
        partySnapshot: { fullName: party.fullName, phone: party.phone, email: party.email },
        createdBy: params.createdByUserId,
      })
      .returning();

    const insertedLines = await tx
      .insert(invoiceLines)
      .values(
        params.lines.map((l) => {
          const quantity = l.quantity ?? 1;
          const discount = l.discount ?? 0;
          return {
            invoiceId: invoice.id,
            lineType: l.lineType,
            description: l.description,
            quantity,
            unitPrice: l.unitPrice.toFixed(2),
            discount: discount.toFixed(2),
            lineTotal: lineTotal(l.unitPrice, quantity, discount).toFixed(2),
          };
        }),
      )
      .returning();

    await recomputeInvoiceTotals(tx, invoice.id);
    return { invoice, insertedLines };
  });

  await logAudit({
    userId: params.createdByUserId,
    action: "INVOICE_DRAFT_CREATED",
    entityType: "invoices",
    entityId: String(result.invoice.id),
    metadata: { partyId: params.partyId },
  });

  return toView(result.invoice, result.insertedLines);
}

// Promotion — M4: "creates a new invoice that snapshots [the proforma's] lines; the
// proforma is retained." Blocked if the proforma already expired.
export async function promoteProformaToInvoice(
  proformaId: number,
  createdByUserId: number,
): Promise<InvoiceView> {
  const [proforma] = await db.select().from(proformas).where(eq(proformas.id, proformaId));
  if (!proforma) throw new Error("PROFORMA_NOT_FOUND");
  if (proforma.status === "expired") throw new Error("PROFORMA_EXPIRED"); // M4: invoice creation blocked from expired proforma
  if (proforma.status === "cancelled") throw new Error("PROFORMA_CANCELLED");

  const sourceLines = await db
    .select()
    .from(proformaLines)
    .where(eq(proformaLines.proformaId, proformaId));
  if (sourceLines.length === 0) throw new Error("PROFORMA_HAS_NO_LINES");

  const [party] = await db.select().from(parties).where(eq(parties.id, proforma.partyId));
  if (!party) throw new Error("PARTY_NOT_FOUND");

  const result = await db.transaction(async (tx: any) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        proformaId: proforma.id,
        partyId: proforma.partyId,
        partySnapshot: proforma.partySnapshot, // carry the ORIGINAL snapshot forward, not a re-read
        createdBy: createdByUserId,
      })
      .returning();

    const insertedLines = await tx
      .insert(invoiceLines)
      .values(
        sourceLines.map((l) => ({
          invoiceId: invoice.id,
          lineType: l.lineType,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          lineTotal: l.lineTotal,
        })),
      )
      .returning();

    await recomputeInvoiceTotals(tx, invoice.id);
    return { invoice, insertedLines };
  });

  await logAudit({
    userId: createdByUserId,
    action: "INVOICE_PROMOTED_FROM_PROFORMA",
    entityType: "invoices",
    entityId: String(result.invoice.id),
    metadata: { proformaId },
  });

  return toView(result.invoice, result.insertedLines);
}

export async function addLine(
  invoiceId: number,
  line: {
    lineType: "ticket" | "shop";
    description: string;
    quantity?: number;
    unitPrice: number;
    discount?: number;
  },
  userId: number,
): Promise<InvoiceView> {
  await assertDraft(invoiceId);
  await assertCanDiscount(userId, [line]);
  const quantity = line.quantity ?? 1;
  const discount = line.discount ?? 0;

  await db.transaction(async (tx: any) => {
    await tx.insert(invoiceLines).values({
      invoiceId,
      lineType: line.lineType,
      description: line.description,
      quantity,
      unitPrice: line.unitPrice.toFixed(2),
      discount: discount.toFixed(2),
      lineTotal: lineTotal(line.unitPrice, quantity, discount).toFixed(2),
    });
    await recomputeInvoiceTotals(tx, invoiceId);
  });

  await logAudit({
    userId,
    action: "INVOICE_LINE_ADDED",
    entityType: "invoices",
    entityId: String(invoiceId),
  });
  return getInvoiceById(invoiceId);
}

export async function removeLine(
  invoiceId: number,
  lineId: number,
  userId: number,
): Promise<InvoiceView> {
  await assertDraft(invoiceId);

  await db.transaction(async (tx: any) => {
    await tx
      .delete(invoiceLines)
      .where(and(eq(invoiceLines.id, lineId), eq(invoiceLines.invoiceId, invoiceId)));
    await recomputeInvoiceTotals(tx, invoiceId);
  });

  await logAudit({
    userId,
    action: "INVOICE_LINE_REMOVED",
    entityType: "invoices",
    entityId: String(invoiceId),
    metadata: { lineId },
  });
  return getInvoiceById(invoiceId);
}

// The single commitment point — M4: "one DB transaction: status → issued, allocate
// invoice number, mark attached orders invoiced, decrement stock. All-or-nothing.
// Idempotent via requestId."
//
// "Mark attached orders invoiced" and "decrement stock" are NO-OPS here — M8
// (ticketing, Sprint 6) and M9 (stock, Sprint 7) don't exist yet. Both are marked
// with TODO below for those sprints to fill in, inside this same transaction, so
// the atomicity guarantee holds once they land (no separate non-blocking calls,
// which was the legacy bug this rewrite specifically fixes).
export async function issueInvoice(params: IssueInvoiceParams): Promise<InvoiceView> {
  // Idempotency check OUTSIDE the transaction: if this requestId was already used,
  // return the already-issued result instead of erroring — a genuine retry (network
  // blip, double-click) must be a no-op, not a failure.
  const [existingByRequestId] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.requestId, params.requestId));
  if (existingByRequestId) {
    const lines = await db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, existingByRequestId.id));
    return toView(existingByRequestId, lines);
  }

  const invoice = await assertDraft(params.invoiceId);
  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, params.invoiceId));
  if (lines.length === 0) throw new Error("INVOICE_HAS_NO_LINES");

  const dueDateOffsetDays = await getIntValue("default_due_date_offset_days", 30);
  const totalAmount = parseFloat(invoice.totalAmount);

  // M5: payment mode chosen at issue, installments created inside the SAME
  // transaction as numbering — not a separate step.
  if (params.paymentPlan.mode === "installments") {
    const planInstallments = params.paymentPlan.installments ?? [];
    if (planInstallments.length === 0 || planInstallments.length > 3) {
      throw new Error("INVALID_INSTALLMENT_COUNT"); // MAX_INSTALLMENTS = 3, at least 1 (the avance)
    }
    const sum = planInstallments.reduce((s: any, i: any) => s + i.expectedAmount, 0);
    if (Math.abs(sum - totalAmount) > 0.01) {
      throw new Error("INSTALLMENTS_MUST_SUM_TO_TOTAL"); // Σ = invoice total, enforced at issue
    }
  }

  const result = await db.transaction(async (tx: any) => {
    const number = await getNextNumber(tx, "INV");
    const issuedAt = new Date();

    let dueDate: Date;
    let installmentRows: { sequence: number; expectedDate: string; expectedAmount: number }[];

    if (params.paymentPlan.mode === "full") {
      dueDate = new Date(issuedAt.getTime() + dueDateOffsetDays * 24 * 60 * 60 * 1000);
      installmentRows = [
        {
          sequence: 1,
          expectedDate: dueDate.toISOString().split("T")[0],
          expectedAmount: totalAmount,
        },
      ];
    } else {
      const planInstallments = params.paymentPlan.installments!;
      installmentRows = planInstallments.map((inst, i) => ({
        sequence: i + 1,
        expectedDate: inst.expectedDate,
        expectedAmount: inst.expectedAmount,
      }));
      // Invoice final due date = last échéance (M5 spec)
      dueDate = new Date(planInstallments[planInstallments.length - 1].expectedDate);
    }

    const [updated] = await tx
      .update(invoices)
      .set({
        status: "issued",
        number,
        requestId: params.requestId,
        issuedAt,
        dueDate: dueDate.toISOString().split("T")[0],
      })
      .where(eq(invoices.id, params.invoiceId))
      .returning();

    await tx.insert(installments).values(
      installmentRows.map((row) => ({
        invoiceId: params.invoiceId,
        sequence: row.sequence,
        expectedDate: row.expectedDate,
        expectedAmount: row.expectedAmount.toFixed(2),
      })),
    );

    // TODO (Sprint 6 / M8, Sprint 7 / M9): inside THIS transaction —
    //   - mark each attached ticket/shop order `invoiced`
    //   - for shop lines with a stockArticleId, create a stock OUT movement
    // Both must happen here, not as separate calls, to preserve the all-or-nothing
    // guarantee this function exists to provide.

    return updated;
  });

  await logAudit({
    userId: params.userId,
    action: "INVOICE_ISSUED",
    entityType: "invoices",
    entityId: String(result.id),
    metadata: { number: result.number, requestId: params.requestId },
  });

  return toView(result, lines);
}

// Cancellation — M4: privileged admin+ (enforced at route level), reason required,
// audited, terminal. Money → credit; penalty-void and stock-reverse are TODO until
// M6 (Sprint 5) and M9 (Sprint 7) exist.
export async function cancelInvoice(params: CancelInvoiceParams): Promise<InvoiceView> {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, params.invoiceId));
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  if (invoice.status !== "issued") throw new Error("ONLY_ISSUED_INVOICES_CAN_BE_CANCELLED");
  if (!params.reason?.trim()) throw new Error("CANCEL_REASON_REQUIRED");

  // M5 now exists — compute the REAL paid amount instead of relying on the
  // caller to supply it. Sum every payment row's amountApplied across every
  // installment on this invoice.
  const invoiceInstallments = await db
    .select()
    .from(installments)
    .where(eq(installments.invoiceId, params.invoiceId));
  const installmentIds = invoiceInstallments.map((i) => i.id);
  let totalPaid = 0;
  for (const id of installmentIds) {
    const rows = await db.select().from(payments).where(eq(payments.installmentId, id));
    totalPaid += rows.reduce((sum, p) => sum + parseFloat(p.amountApplied), 0);
  }

  const [updated] = await db
    .update(invoices)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: params.reason,
      cancelledBy: params.userId,
    })
    .where(eq(invoices.id, params.invoiceId))
    .returning();

  // Paid money → credit/avoir (V1 rule) — now computed for real, not passed in.
  if (totalPaid > 0) {
    await createCreditLot({
      partyId: invoice.partyId,
      amount: totalPaid,
      sourceInvoiceId: invoice.id,
      userId: params.userId,
    });
  }

  // TODO (Sprint 5 / M6): void every penalty row tied to this invoice's installments.
  // TODO (Sprint 7 / M9): compensating stock IN for every OUT this invoice triggered.

  await logAudit({
    userId: params.userId,
    action: "INVOICE_CANCELLED",
    entityType: "invoices",
    entityId: String(updated.id),
    metadata: { reason: params.reason },
  });

  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, updated.id));
  return toView(updated, lines);
}

export async function getInvoiceById(id: number): Promise<InvoiceView> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv) throw new Error("INVOICE_NOT_FOUND");
  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, id));
  return toView(inv, lines);
}

export async function listInvoices(partyId?: number): Promise<InvoiceView[]> {
  const rows = partyId
    ? await db.select().from(invoices).where(eq(invoices.partyId, partyId))
    : await db.select().from(invoices);

  const results: InvoiceView[] = [];
  for (const inv of rows) {
    const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id));
    results.push(await toView(inv, lines));
  }
  return results;
}
