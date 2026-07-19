import { db } from "../../../db/index.js";
import { invoices, installments, payments, parties, penalties } from "../../../db/schema.js";
import { eq, and, isNull, lt, inArray } from "drizzle-orm";
import type { CreanceRow } from "./penalty.types.js";

// M6/M3: "Overdue = status issued AND dueDate < today" (kept exactly from
// legacy — the one rule explicitly worth preserving). This is the SINGLE
// aggregation query — Sprint 10 (M12 dashboard) AND the party-detail page's
// créances card both call this same function rather than re-deriving
// "overdue"/"owed" with their own ad-hoc filter, which is exactly the legacy
// bug the spec calls out to fix.
export async function getCreances(onlyOverdue = false, partyId?: number): Promise<CreanceRow[]> {
  const invoiceConditions = [eq(invoices.status, "issued")];
  if (partyId) invoiceConditions.push(eq(invoices.partyId, partyId));
  const issuedInvoices = await db.select().from(invoices).where(and(...invoiceConditions));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: CreanceRow[] = [];

  for (const invoice of issuedInvoices) {
    const invoiceInstallments = await db
      .select()
      .from(installments)
      .where(eq(installments.invoiceId, invoice.id));

    const [party] = await db.select().from(parties).where(eq(parties.id, invoice.partyId));

    for (const inst of invoiceInstallments) {
      if (inst.status === "paid") continue; // fully settled — not a créance

      const principalRows = await db
        .select()
        .from(payments)
        .where(eq(payments.installmentId, inst.id));
      const principalPaid = principalRows
        .filter((p) => p.allocationTarget !== "penalty")
        .reduce((sum, p) => sum + parseFloat(p.amountApplied), 0);
      const penaltyPaid = principalRows
        .filter((p) => p.allocationTarget === "penalty")
        .reduce((sum, p) => sum + parseFloat(p.amountApplied), 0);

      const penaltyRows = await db
        .select()
        .from(penalties)
        .where(and(eq(penalties.installmentId, inst.id), isNull(penalties.voidedAt)));
      const penaltyAccrued = penaltyRows.reduce((sum, p) => sum + parseFloat(p.amountXaf), 0);

      const expectedAmount = parseFloat(inst.expectedAmount);
      const principalDue = Math.max(0, expectedAmount - principalPaid);
      const penaltyDue = Math.max(0, penaltyAccrued - penaltyPaid);
      const isOverdue = new Date(inst.expectedDate) < today;

      if (principalDue <= 0.01 && penaltyDue <= 0.01) continue; // nothing actually owed
      if (onlyOverdue && !isOverdue) continue;

      rows.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number ?? undefined,
        partyId: invoice.partyId,
        partyName: party?.fullName ?? "—",
        installmentId: inst.id,
        sequence: inst.sequence,
        expectedDate: inst.expectedDate,
        expectedAmount: inst.expectedAmount,
        principalPaid: principalPaid.toFixed(2),
        principalDue: principalDue.toFixed(2),
        penaltyAccrued: penaltyAccrued.toFixed(2),
        penaltyPaid: penaltyPaid.toFixed(2),
        penaltyDue: penaltyDue.toFixed(2),
        isOverdue,
      });
    }
  }

  return rows;
}
