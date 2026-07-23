import fs from "node:fs";
import path from "node:path";
import { db } from "../../../db/index.js";
import { invoices, users, payments } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { generatePdf } from "../../../utils/pdf.js";
import {
  renderInvoiceHtml,
  resolveBuyerLabel,
  type PrintInvoiceData,
  type PrintLineItem,
} from "../templates/invoice-print.template.js";
import { getInvoiceById } from "./invoice.service.js";
import { logAudit } from "@/modules/auth/services/auth.service.js";
import { listInstallmentsByInvoice } from "./payment.service.js";

// M8: display-only abbreviation layer over the stored enum — changing this map
// later is a no-op, no data migration (spec's whole point of keeping it separate
// from the stored value). "prm" for Premium is pending final client confirmation
// (see TASKS.md/Notion — technical model is locked regardless of the final label).
const TRAVEL_CLASS_ABBREV: Record<string, string> = {
  economy: "eco",
  business: "bnss",
  first: "prem",
  premium: "prm",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "CASH",
  mobile_money: "MOBILE MONEY",
  virement: "VIREMENT",
  credit: "CRÉDIT",
  epargne: "ÉPARGNE",
};

const INSTALLMENT_STATUS_MAP: Record<string, "unpaid" | "partial" | "paid"> = {
  unpaid: "unpaid",
  partial: "partial",
  paid: "paid",
};

let cachedLogoBase64: string | null = null;
function getLogoBase64(): string {
  if (cachedLogoBase64) return cachedLogoBase64;
  const logoPath = path.resolve(process.cwd(), "../client/public/brand/logo.jpg");
  cachedLogoBase64 = `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString("base64")}`;
  return cachedLogoBase64;
}

function fmtDateShort(d: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(d));
}

export async function generateInvoicePdf(
  invoiceId: number,
  requestedByUserId: number,
): Promise<Buffer> {
  const invoice = await getInvoiceById(invoiceId);

  const [agent] = await db.select().from(users).where(eq(users.id, invoice.createdBy));

  const invoicePayments = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  const paymentMethod = invoicePayments[0]?.method;
  const paidAmount = invoicePayments
    .filter((p) => p.allocationTarget !== "penalty")
    .reduce((sum, p) => sum + parseFloat(p.amountApplied), 0);

  const { buyerName, buyerPhone, buyerTaxId } = resolveBuyerLabel(
    invoice.partySnapshot as {
      fullName?: string;
      phone?: string;
      partyType?: string;
      tradeName?: string;
      taxId?: string;
    },
  );

  const items: PrintLineItem[] = invoice.lines.map((l) => {
    if (l.ticketDetails) {
      const td = l.ticketDetails;
      const segments = td.segments as
        Array<{ from: string; to: string; date: string; returnDate?: string }> | undefined;
      const firstSegment = segments?.[0];
      return {
        clientName: td.passengerName,
        category: "Billetterie",
        detail: firstSegment
          ? `${firstSegment.from} → ${segments![segments!.length - 1].to}`
          : l.description,
        date: firstSegment ? fmtDateShort(firstSegment.date) : undefined,
        returnDate: firstSegment?.returnDate ? fmtDateShort(firstSegment.returnDate) : undefined,
        travelClass: TRAVEL_CLASS_ABBREV[td.travelClass] ?? td.travelClass,
        unitPrice: parseFloat(l.unitPrice),
        discount: parseFloat(l.discount),
        total: parseFloat(l.lineTotal),
      };
    }

    if (l.lineType === "shop") {
      return {
        clientName: l.shopDetails?.passengerName || buyerName,
        category: "PrestiShop",
        detail: l.description,
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

  const installmentRows = await listInstallmentsByInvoice(invoiceId);

  const printData: PrintInvoiceData = {
    docType: "invoice",
    docNumber: invoice.number ?? `BROUILLON-${invoice.id}`,
    issueDate: invoice.issuedAt ? fmtDateShort(invoice.issuedAt) : fmtDateShort(invoice.createdAt),
    dueDate: invoice.dueDate ? fmtDateShort(invoice.dueDate) : undefined,
    paymentMode: paymentMethod ? (PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod) : "-",
    agentName: agent?.fullName,
    buyerName,
    buyerPhone,
    buyerTaxId,
    logoBase64: getLogoBase64(),
    items,
    subtotal: parseFloat(invoice.totalAmount) + parseFloat(invoice.totalDiscount),
    discount: parseFloat(invoice.totalDiscount),
    total: parseFloat(invoice.totalAmount),
    paidAmount,
    balanceDue: Math.max(0, parseFloat(invoice.totalAmount) - paidAmount),
    receivedOn: invoice.paymentStatus === "paid" ? fmtDateShort(new Date()) : undefined,
    installments: installmentRows.map((inst) => ({
      sequence: inst.sequence,
      dueDate: fmtDateShort(inst.expectedDate),
      expectedAmount: parseFloat(inst.expectedAmount),
      paidAmount: parseFloat(inst.paidAmount),
      status: INSTALLMENT_STATUS_MAP[inst.status] ?? "unpaid",
    })),
  };

  const html = renderInvoiceHtml(printData);
  const pdf = await generatePdf(html);

  await logAudit({
    userId: requestedByUserId,
    action: "DOCUMENT_PRINTED",
    entityType: "invoices",
    entityId: String(invoiceId),
  });

  return pdf;
}
