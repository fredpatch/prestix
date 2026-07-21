import fs from "node:fs";
import path from "node:path";
import { logAudit } from "@/modules/auth/services/auth.service.js";
import { sendTrackedMail } from "@/modules/notifications/services/mail-outbox.service.js";
import type { SendTrackedMailResult } from "@/modules/notifications/services/mail-outbox.types.js";
import { getStringValue } from "@/modules/settings/services/settings.service.js";
import { generateDeliveryNotePdf } from "./delivery-note-pdf.service.js";
import { getByInvoiceId } from "./delivery-note.service.js";
import { generateInvoicePdf } from "./invoice-pdf.service.js";
import { getInvoiceById } from "./invoice.service.js";
import { generateProformaPdf } from "./proforma-pdf.service.js";
import { getProformaById } from "./proforma.service.js";

type DocumentKind = "invoice" | "proforma" | "delivery_note";
type EmailAttachment = NonNullable<Parameters<typeof sendTrackedMail>[0]["attachments"]>[number];

const EMAIL_ASSET_DIR = path.resolve(
  process.cwd(),
  "src/modules/documents/email-assets",
);
const HEADER_ASSET = path.join(EMAIL_ASSET_DIR, "prestigieux-email-header.png");
const FOOTER_ASSET = path.join(EMAIL_ASSET_DIR, "prestigieux-email-footer.png");
const HEADER_CID = "prestigieux-email-header";
const FOOTER_CID = "prestigieux-email-footer";

interface SendDocumentEmailParams {
  id: number;
  requestedByUserId: number;
  to?: string;
  trigger?: "manual" | "automatic";
}

function recipientEmail(snapshot: unknown, override?: string): string {
  const email = override?.trim() || (snapshot as { email?: string } | undefined)?.email?.trim();
  if (!email) throw new Error("RECIPIENT_EMAIL_REQUIRED");
  return email;
}

function partyName(snapshot: unknown): string {
  return (snapshot as { fullName?: string } | undefined)?.fullName ?? "client";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value: string | number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Number(value))} XAF`;
}

function fmtDateLong(value?: Date | string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function statusPill(label: string): string {
  return `<span style="display:inline-block;background:#b88305;color:#ffffff;border-radius:999px;padding:6px 14px;font-weight:700;font-size:13px;">${escapeHtml(label)}</span>`;
}

function summaryRows(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="border-bottom:1px dashed #dde3ec;padding:13px 18px;color:#111827;font-weight:700;width:42%;font-size:14px;">${escapeHtml(row.label)}</td>
          <td style="border-bottom:1px dashed #dde3ec;padding:13px 18px;color:${row.highlight ? "#b88305" : "#111827"};font-weight:${row.highlight ? "800" : "500"};font-size:14px;">${row.value}</td>
        </tr>
      `,
    )
    .join("");
}

function emailAssetAttachments(): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];
  if (fs.existsSync(HEADER_ASSET)) {
    attachments.push({
      filename: "prestigieux-email-header.png",
      path: HEADER_ASSET,
      cid: HEADER_CID,
      contentDisposition: "inline",
    });
  }
  if (fs.existsSync(FOOTER_ASSET)) {
    attachments.push({
      filename: "prestigieux-email-footer.png",
      path: FOOTER_ASSET,
      cid: FOOTER_CID,
      contentDisposition: "inline",
    });
  }
  return attachments;
}

function headerMarkup(): string {
  if (fs.existsSync(HEADER_ASSET)) {
    return `<img src="cid:${HEADER_CID}" width="640" alt="Le Prestigieux - Une autre idee du voyage" style="display:block;width:100%;max-width:640px;height:auto;border:0;" />`;
  }
  return `
    <div style="height:120px;background:#e8f4ff;text-align:center;border-bottom:4px solid #c58b12;">
      <div style="padding-top:34px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:800;letter-spacing:2.5px;color:#111827;">LE PRESTIGIEUX</div>
      <div style="margin-top:4px;font-size:12px;letter-spacing:9px;color:#111827;">Une autre idee du voyage</div>
    </div>
  `;
}

function footerMarkup(senderName: string): string {
  if (fs.existsSync(FOOTER_ASSET)) {
    return `<img src="cid:${FOOTER_CID}" width="640" alt="${escapeHtml(senderName)} - contact agence" style="display:block;width:100%;max-width:640px;height:auto;border:0;" />`;
  }
  return `
    <div style="border-top:1px solid #ecd9af;background:#fff8eb;padding:20px 32px 24px;text-align:center;color:#334155;font-size:14px;">
      <div style="font-weight:800;color:#111827;">${escapeHtml(senderName)}</div>
      <div style="margin-top:8px;">+241 04 13 13 47 / 02 36 33 79</div>
      <a href="mailto:leprestigieuxv@gmail.com" style="color:#075be8;text-decoration:underline;">leprestigieuxv@gmail.com</a>
    </div>
  `;
}

function htmlShell(params: {
  title: string;
  sectionLabel: string;
  intro: string;
  summaryRows: Array<{ label: string; value: string; highlight?: boolean }>;
  footerNote?: string;
  senderName: string;
}): string {
  return `
    <div style="margin:0;padding:32px;background:#f3f8ff;font-family:Arial,sans-serif;color:#111827;line-height:1.55;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #cfe0f5;border-radius:12px;overflow:hidden;box-shadow:0 18px 42px rgba(15,23,42,0.12);">
        ${headerMarkup()}
        <div style="height:0;text-align:center;">
          <span style="display:inline-block;min-width:150px;background:#c58b12;color:#ffffff;border-radius:0 0 18px 18px;padding:8px 20px 10px;font-size:14px;font-weight:800;letter-spacing:.4px;position:relative;top:-1px;">${escapeHtml(params.sectionLabel)}</span>
        </div>
        <div style="padding:58px 42px 34px;">
          <h1 style="margin:0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.18;color:#0f172a;">${escapeHtml(params.title)}</h1>
          <div style="margin:24px auto 28px;width:200px;border-top:2px solid #d0a13a;"></div>
          <p style="margin:0 0 8px;font-size:16px;color:#111827;">Bonjour,</p>
          <p style="margin:0 0 24px;color:#415169;font-size:15px;">${escapeHtml(params.intro)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #dde3ec;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden;background:#ffffff;">
            ${summaryRows(params.summaryRows)}
          </table>
          <div style="margin-top:22px;border:1px solid #bfdbfe;background:#eaf4ff;border-radius:10px;padding:15px 18px;color:#075be8;font-weight:700;">
            PDF du document en piece jointe
          </div>
          <p style="margin:26px 0 0;text-align:center;color:#111827;font-size:16px;">${escapeHtml(params.footerNote ?? "Merci de votre confiance.")}</p>
        </div>
        ${footerMarkup(params.senderName)}
      </div>
    </div>
  `;
}

function documentMetadata(kind: DocumentKind, id: number, number?: string, trigger = "manual") {
  return { kind, documentId: id, documentNumber: number, trigger };
}

async function auditDocumentEmail(kind: DocumentKind, id: number, userId: number): Promise<void> {
  await logAudit({
    userId,
    action: "DOCUMENT_EMAILED",
    entityType: kind === "delivery_note" ? "delivery_notes" : `${kind}s`,
    entityId: String(id),
  });
}

export async function sendInvoiceEmail(
  params: SendDocumentEmailParams,
): Promise<SendTrackedMailResult> {
  const invoice = await getInvoiceById(params.id);
  if (invoice.status !== "issued") throw new Error("INVOICE_NOT_ISSUED");

  const to = recipientEmail(invoice.partySnapshot, params.to);
  const buyer = partyName(invoice.partySnapshot);
  const buyerHtml = escapeHtml(buyer);
  const number = invoice.number ?? `facture-${invoice.id}`;
  const senderName = await getStringValue("mail_sender_name", "PrestiX");
  const pdf = await generateInvoicePdf(invoice.id, params.requestedByUserId);

  const result = await sendTrackedMail({
    to,
    subject: `PrestiX - Facture ${number}`,
    text:
      `Bonjour ${buyer},\n\n` +
      `Veuillez trouver en piece jointe votre facture ${number} d'un montant de ${money(invoice.totalAmount)}.\n\n` +
      "Merci pour votre confiance.\nPrestiX",
    html: htmlShell({
      title: "Votre facture est disponible",
      sectionLabel: "FACTURATION",
      intro: `Nous vous prions de trouver en piece jointe la facture relative a votre reservation pour ${buyer}.`,
      summaryRows: [
        { label: "Facture", value: escapeHtml(number), highlight: true },
        { label: "Client", value: buyerHtml },
        { label: "Date d'emission", value: escapeHtml(fmtDateLong(invoice.issuedAt ?? invoice.createdAt)) },
        { label: "Echeance", value: escapeHtml(fmtDateLong(invoice.dueDate)), highlight: true },
        { label: "Montant total", value: escapeHtml(money(invoice.totalAmount)), highlight: true },
        { label: "Statut", value: statusPill(invoice.paymentStatus === "paid" ? "Payee" : "A payer") },
      ],
      senderName,
    }),
    attachments: [
      ...emailAssetAttachments(),
      { filename: `${number}.pdf`, content: pdf, contentType: "application/pdf" },
    ],
    templateKey: "invoice_pdf",
    sourceType: "invoices",
    sourceId: String(invoice.id),
    metadata: documentMetadata("invoice", invoice.id, invoice.number, params.trigger),
  });

  if (result.success) await auditDocumentEmail("invoice", invoice.id, params.requestedByUserId);
  return result;
}

export async function sendProformaEmail(
  params: SendDocumentEmailParams,
): Promise<SendTrackedMailResult> {
  const proforma = await getProformaById(params.id);
  if (proforma.status !== "draft") throw new Error("PROFORMA_NOT_SENDABLE");

  const to = recipientEmail(proforma.partySnapshot, params.to);
  const buyer = partyName(proforma.partySnapshot);
  const buyerHtml = escapeHtml(buyer);
  const total = proforma.lines.reduce((sum, line) => sum + Number(line.lineTotal), 0);
  const senderName = await getStringValue("mail_sender_name", "PrestiX");
  const pdf = await generateProformaPdf(proforma.id, params.requestedByUserId);

  const result = await sendTrackedMail({
    to,
    subject: `PrestiX - Proforma ${proforma.number}`,
    text:
      `Bonjour ${buyer},\n\n` +
      `Veuillez trouver en piece jointe votre proforma ${proforma.number} d'un montant de ${money(total)}.\n\n` +
      "Merci pour votre confiance.\nPrestiX",
    html: htmlShell({
      title: "Votre proforma est disponible",
      sectionLabel: "PROFORMA",
      intro: `Nous vous prions de trouver en piece jointe la proforma preparee pour ${buyer}.`,
      summaryRows: [
        { label: "Proforma", value: escapeHtml(proforma.number), highlight: true },
        { label: "Client", value: buyerHtml },
        { label: "Date d'emission", value: escapeHtml(fmtDateLong(proforma.createdAt)) },
        { label: "Validite", value: escapeHtml(fmtDateLong(proforma.expiresAt)), highlight: true },
        { label: "Montant total", value: escapeHtml(money(total)), highlight: true },
        { label: "Statut", value: statusPill("A confirmer") },
      ],
      senderName,
    }),
    attachments: [
      ...emailAssetAttachments(),
      { filename: `${proforma.number}.pdf`, content: pdf, contentType: "application/pdf" },
    ],
    templateKey: "proforma_pdf",
    sourceType: "proformas",
    sourceId: String(proforma.id),
    metadata: documentMetadata("proforma", proforma.id, proforma.number, params.trigger),
  });

  if (result.success) await auditDocumentEmail("proforma", proforma.id, params.requestedByUserId);
  return result;
}

export async function sendDeliveryNoteEmail(
  params: SendDocumentEmailParams,
): Promise<SendTrackedMailResult> {
  const deliveryNote = await getByInvoiceId(params.id);
  if (!deliveryNote) throw new Error("DELIVERY_NOTE_NOT_FOUND");

  const invoice = await getInvoiceById(params.id);
  const to = recipientEmail(invoice.partySnapshot, params.to);
  const buyer = partyName(invoice.partySnapshot);
  const buyerHtml = escapeHtml(buyer);
  const number = deliveryNote.number ?? `BL-${deliveryNote.id}`;
  const invoiceNumber = invoice.number ?? String(invoice.id);
  const senderName = await getStringValue("mail_sender_name", "PrestiX");
  const pdf = await generateDeliveryNotePdf(invoice.id, params.requestedByUserId);

  const result = await sendTrackedMail({
    to,
    subject: `PrestiX - Bon de livraison ${number}`,
    text:
      `Bonjour ${buyer},\n\n` +
      `Veuillez trouver en piece jointe votre bon de livraison ${number}, rattache a la facture ${invoiceNumber}.\n\nPrestiX`,
    html: htmlShell({
      title: "Votre bon de livraison est disponible",
      sectionLabel: "BON DE LIVRAISON",
      intro: `Nous vous prions de trouver en piece jointe le bon de livraison prepare pour ${buyer}.`,
      summaryRows: [
        { label: "Bon de livraison", value: escapeHtml(number), highlight: true },
        { label: "Client", value: buyerHtml },
        { label: "Facture liee", value: escapeHtml(invoiceNumber), highlight: true },
        { label: "Date d'emission", value: escapeHtml(fmtDateLong(deliveryNote.issuedAt)) },
        { label: "Montant facture", value: escapeHtml(money(invoice.totalAmount)), highlight: true },
        { label: "Statut", value: statusPill("Document joint") },
      ],
      senderName,
    }),
    attachments: [
      ...emailAssetAttachments(),
      { filename: `${number}.pdf`, content: pdf, contentType: "application/pdf" },
    ],
    templateKey: "delivery_note_pdf",
    sourceType: "delivery_notes",
    sourceId: String(deliveryNote.id),
    metadata: documentMetadata("delivery_note", deliveryNote.id, deliveryNote.number, params.trigger),
  });

  if (result.success) {
    await auditDocumentEmail("delivery_note", deliveryNote.id, params.requestedByUserId);
  }
  return result;
}
