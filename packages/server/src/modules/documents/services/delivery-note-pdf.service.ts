import fs from "node:fs";
import path from "node:path";
import { db } from "../../../db/index.js";
import { users, invoices } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { generatePdf } from "../../../utils/pdf.js";
import {
  renderInvoiceHtml,
  type PrintInvoiceData,
  type PrintLineItem,
} from "../templates/invoice-print.template.js";
import { getByInvoiceId } from "./delivery-note.service.js";
import { getInvoiceById } from "./invoice.service.js";
import { logAudit } from "../../auth/services/auth.service.js";

const TRAVEL_CLASS_ABBREV: Record<string, string> = {
  economy: "eco",
  business: "bnss",
  first: "prem",
  premium: "prm",
};

function fmtDateShort(d: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(d));
}

let cachedLogoBase64: string | null = null;
function getLogoBase64(): string {
  if (cachedLogoBase64) return cachedLogoBase64;
  const logoPath = path.resolve(process.cwd(), "../client/public/brand/logo.jpg");
  cachedLogoBase64 = `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString("base64")}`;
  return cachedLogoBase64;
}

// M4: BL — no payment recap (showPaymentRecap in the template is gated to
// docType === 'invoice' only, so this falls through to false automatically).
// Uses the SAME line/party data as the parent invoice — a BL doesn't have its
// own lines, it's a delivery confirmation referencing the invoice.
export async function generateDeliveryNotePdf(
  invoiceId: number,
  requestedByUserId: number,
): Promise<Buffer> {
  const bl = await getByInvoiceId(invoiceId);
  if (!bl) throw new Error("DELIVERY_NOTE_NOT_FOUND");

  const invoice = await getInvoiceById(invoiceId);
  const [invRow] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  const [agent] = await db.select().from(users).where(eq(users.id, invRow.createdBy));

  const buyerName = (invoice.partySnapshot as { fullName?: string }).fullName ?? "—";
  const buyerPhone = (invoice.partySnapshot as { phone?: string }).phone;

  const items: PrintLineItem[] = invoice.lines.map((l) => {
    if (l.ticketDetails) {
      const td = l.ticketDetails;
      const segments = td.segments as Array<{ from: string; to: string; date: string }> | undefined;
      const firstSegment = segments?.[0];
      return {
        clientName: td.passengerName,
        category: "Billetterie",
        detail: firstSegment
          ? `${firstSegment.from} → ${segments![segments!.length - 1].to}`
          : l.description,
        date: firstSegment ? fmtDateShort(firstSegment.date) : undefined,
        travelClass: TRAVEL_CLASS_ABBREV[td.travelClass] ?? td.travelClass,
        unitPrice: parseFloat(l.unitPrice),
        discount: parseFloat(l.discount),
        total: parseFloat(l.lineTotal),
      };
    }
    return {
      clientName: buyerName,
      category: l.lineType === "shop" ? "PrestiShop" : "Service",
      detail: l.description,
      unitPrice: parseFloat(l.unitPrice),
      discount: parseFloat(l.discount),
      total: parseFloat(l.lineTotal),
    };
  });

  const printData: PrintInvoiceData = {
    docType: "delivery_note",
    docNumber: bl.number ?? `BL-${invoiceId}`,
    issueDate: fmtDateShort(bl.issuedAt),
    paymentMode: "-",
    agentName: agent?.fullName,
    buyerName,
    buyerPhone,
    logoBase64: getLogoBase64(),
    items,
    subtotal: parseFloat(invoice.totalAmount) + parseFloat(invoice.totalDiscount),
    discount: parseFloat(invoice.totalDiscount),
    total: parseFloat(invoice.totalAmount),
  };

  const html = renderInvoiceHtml(printData);
  const pdf = await generatePdf(html);

  await logAudit({
    userId: requestedByUserId,
    action: "DOCUMENT_PRINTED",
    entityType: "delivery_notes",
    entityId: String(bl.id),
  });

  return pdf;
}
