import { db } from "../../../db/index.js";
import { deliveryNotes, invoices } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";

export interface DeliveryNoteView {
  id: number;
  number?: string;
  invoiceId: number;
  issuedAt: Date;
}

function toView(bl: typeof deliveryNotes.$inferSelect): DeliveryNoteView {
  return {
    id: bl.id,
    number: bl.number ?? undefined,
    invoiceId: bl.invoiceId,
    issuedAt: bl.issuedAt,
  };
}

// M4: "BL generated after full payment; no payment recap." The full-payment check is a
// TODO — it depends on invoice payment status, which doesn't exist until M5 (Sprint 4).
// For now this only checks the invoice is `issued` (the one precondition we CAN verify
// today) — the real payment gate must be added here once M5 lands, before this is safe
// to expose without supervision.
export async function createDeliveryNote(
  invoiceId: number,
  userId: number,
): Promise<DeliveryNoteView> {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  if (invoice.status !== "issued") throw new Error("INVOICE_NOT_ISSUED");

  // TODO (Sprint 4 / M5): reject here if invoice payment status !== 'paid'.

  const serial = invoice.number?.split("-").pop() ?? String(invoice.id);
  const number = `BL-${serial}`;

  const [bl] = await db.insert(deliveryNotes).values({ number, invoiceId }).returning();

  await logAudit({
    userId,
    action: "DELIVERY_NOTE_CREATED",
    entityType: "delivery_notes",
    entityId: String(bl.id),
    metadata: { invoiceId, number },
  });

  return toView(bl);
}

export async function getByInvoiceId(invoiceId: number): Promise<DeliveryNoteView | null> {
  const [bl] = await db.select().from(deliveryNotes).where(eq(deliveryNotes.invoiceId, invoiceId));
  return bl ? toView(bl) : null;
}
