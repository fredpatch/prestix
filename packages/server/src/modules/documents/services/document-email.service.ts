import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db/index.js";
import { roleLevel, users } from "@/db/schema.js";
import { logAudit } from "@/modules/auth/services/auth.service.js";
import { sendTrackedMail } from "@/modules/notifications/services/mail-outbox.service.js";
import type { SendTrackedMailResult } from "@/modules/notifications/services/mail-outbox.types.js";
import { getBoolValue } from "@/modules/settings/services/settings.service.js";
import {
  emailIconAttachments,
  emailShell,
  escapeHtml,
  fmtDateLong,
  money,
  statusPill,
  warningCallout,
  type InfoRow,
} from "./email-shell.js";
import { generateDeliveryNotePdf } from "./delivery-note-pdf.service.js";
import { getByInvoiceId } from "./delivery-note.service.js";
import { generateInvoicePdf } from "./invoice-pdf.service.js";
import { getInvoiceById } from "./invoice.service.js";
import { generateProformaPdf } from "./proforma-pdf.service.js";
import { getProformaById } from "./proforma.service.js";

type DocumentKind = "invoice" | "proforma" | "delivery_note";

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

// Every admin/super_admin's live email, active accounts only — the "app
// owner" recipient set for scenario #7 (manual/automatic reminder cc). Same
// role-gating pattern as notification.service.ts's listRecipients, but we
// need actual addresses here rather than user ids for an outbound email.
// Gated by mail_owner_reminder_cc_enabled so the behavior can be switched
// off without a deploy.
async function listOwnerEmails(): Promise<string[]> {
  const ccEnabled = await getBoolValue("mail_owner_reminder_cc_enabled", true);
  if (!ccEnabled) return [];
  const rows = await db
    .select({ email: users.email, role: users.role })
    .from(users)
    .where(eq(users.active, true));
  const admins = rows.filter((r) => roleLevel[r.role] >= roleLevel.admin);
  return [...new Set(admins.map((r) => r.email.trim()).filter(Boolean))];
}

export async function sendInvoiceEmail(
  params: SendDocumentEmailParams,
): Promise<SendTrackedMailResult> {
  const invoice = await getInvoiceById(params.id);
  if (invoice.status !== "issued") throw new Error("INVOICE_NOT_ISSUED");

  const to = recipientEmail(invoice.partySnapshot, params.to);
  const buyer = partyName(invoice.partySnapshot);
  const number = invoice.number ?? `facture-${invoice.id}`;
  const pdf = await generateInvoicePdf(invoice.id, params.requestedByUserId);

  const rows: InfoRow[] = [
    { icon: "file-invoice-navy", label: "Facture", value: escapeHtml(number), emphasis: "blue" },
    { icon: "user-navy", label: "Client", value: escapeHtml(buyer) },
    {
      icon: "calendar-event-navy",
      label: "Date d'émission",
      value: escapeHtml(fmtDateLong(invoice.issuedAt ?? invoice.createdAt)),
    },
    {
      icon: "calendar-due-navy",
      label: "Échéance",
      value: escapeHtml(fmtDateLong(invoice.dueDate)),
      emphasis: "gold",
    },
    {
      icon: "coin-navy",
      label: "Montant total",
      value: escapeHtml(money(invoice.totalAmount)),
      emphasis: "gold",
    },
    {
      icon: "info-circle-navy",
      label: "Statut",
      value: statusPill(invoice.paymentStatus === "paid" ? "Payée" : "À payer"),
    },
  ];

  const html = emailShell({
    tone: "blue",
    heroIcon: "hero-receipt",
    bannerHeadline: "Votre facture est disponible",
    bodyGreetingName: buyer,
    bodyIntro:
      "Nous vous remercions pour votre confiance. Veuillez trouver ci-joint votre facture, ainsi qu'un récapitulatif des informations essentielles ci-dessous.",
    rows,
    attachmentLabel: "Facture PDF en pièce jointe",
    // ctaLabel: "Télécharger la facture",
    closingHtml: "Merci de votre confiance.",
  });

  const result = await sendTrackedMail({
    to,
    subject: `PrestiX - Facture ${number}`,
    text:
      `Bonjour ${buyer},\n\n` +
      `Veuillez trouver en piece jointe votre facture ${number} d'un montant de ${money(invoice.totalAmount)}.\n\n` +
      "Merci pour votre confiance.\nPrestiX",
    html,
    attachments: [
      ...emailIconAttachments(),
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

// Scenario #2 — invoice reaches paymentStatus "paid" (full payment only, per
// scope decision). Called from payment.controller.ts right after
// recordPayment() reports becamePaid=true, same fire-and-forget non-blocking
// pattern as the other auto-send hooks.
export async function sendInvoicePaidEmail(
  params: SendDocumentEmailParams,
): Promise<SendTrackedMailResult> {
  const invoice = await getInvoiceById(params.id);
  if (invoice.paymentStatus !== "paid") throw new Error("INVOICE_NOT_FULLY_PAID");

  const to = recipientEmail(invoice.partySnapshot, params.to);
  const buyer = partyName(invoice.partySnapshot);
  const number = invoice.number ?? `facture-${invoice.id}`;

  const rows: InfoRow[] = [
    { icon: "file-invoice-navy", label: "Facture", value: escapeHtml(number), emphasis: "blue" },
    { icon: "user-navy", label: "Client", value: escapeHtml(buyer) },
    {
      icon: "coin-navy",
      label: "Montant réglé",
      value: escapeHtml(money(invoice.totalAmount)),
      emphasis: "gold",
    },
    {
      icon: "calendar-event-navy",
      label: "Date de règlement",
      value: escapeHtml(fmtDateLong(new Date())),
    },
    { icon: "info-circle-navy", label: "Statut", value: statusPill("Payée intégralement") },
  ];

  const html = emailShell({
    tone: "green",
    heroIcon: "hero-circle-check",
    bannerHeadline: "Paiement reçu, merci !",
    bodyGreetingName: buyer,
    bodyIntro:
      "Nous confirmons la réception de votre règlement. Cette facture est désormais soldée intégralement — aucune action supplémentaire n'est requise de votre part.",
    rows,
    closingHtml: "Merci pour votre confiance renouvelée.",
  });

  const result = await sendTrackedMail({
    to,
    subject: `PrestiX - Facture ${number} soldée`,
    text:
      `Bonjour ${buyer},\n\n` +
      `Nous confirmons la reception de votre reglement pour la facture ${number}, ` +
      `d'un montant total de ${money(invoice.totalAmount)}. Cette facture est desormais soldee.\n\n` +
      "Merci pour votre confiance.\nPrestiX",
    html,
    attachments: emailIconAttachments(),
    templateKey: "invoice_paid",
    sourceType: "invoices",
    sourceId: String(invoice.id),
    metadata: documentMetadata("invoice", invoice.id, invoice.number, params.trigger),
  });

  if (result.success) await auditDocumentEmail("invoice", invoice.id, params.requestedByUserId);
  return result;
}

// Scenario #6/#7 — reminder for an overdue invoice, sent to the client AND
// every admin/super_admin ("app owner"), used both by the manual "send
// reminder" controller route and by the automatic overdue cron. Always
// fans out as two separate tracked sends (client + each owner) so outbox
// history and delivery failures stay attributable per recipient.
export async function sendInvoiceReminderEmail(
  params: SendDocumentEmailParams & { daysOverdue: number },
): Promise<{ client: SendTrackedMailResult; owners: SendTrackedMailResult[] }> {
  const invoice = await getInvoiceById(params.id);
  if (invoice.status !== "issued") throw new Error("INVOICE_NOT_ISSUED");
  if (invoice.paymentStatus === "paid") throw new Error("INVOICE_ALREADY_PAID");

  const to = recipientEmail(invoice.partySnapshot, params.to);
  const buyer = partyName(invoice.partySnapshot);
  const number = invoice.number ?? `facture-${invoice.id}`;
  const dueDateLabel = fmtDateLong(invoice.dueDate);
  const daysLabel = `${dueDateLabel} — il y a ${params.daysOverdue} jour${params.daysOverdue > 1 ? "s" : ""}`;

  const rows: InfoRow[] = [
    { icon: "file-invoice-navy", label: "Facture", value: escapeHtml(number), emphasis: "blue" },
    { icon: "user-navy", label: "Client", value: escapeHtml(buyer) },
    {
      icon: "calendar-event-navy",
      label: "Date d'émission",
      value: escapeHtml(fmtDateLong(invoice.issuedAt ?? invoice.createdAt)),
    },
    {
      icon: "calendar-due-navy",
      label: "Échéance dépassée",
      value: escapeHtml(daysLabel),
      emphasis: "red",
    },
    {
      icon: "coin-navy",
      label: "Montant dû",
      value: escapeHtml(money(invoice.totalAmount)),
      emphasis: "red",
    },
    { icon: "info-circle-navy", label: "Statut", value: statusPill("En retard", "red") },
  ];

  const callout = warningCallout(
    "clock-exclamation-navy",
    "Des pénalités de retard s'appliquent chaque semaine tant que la facture reste impayée, conformément à nos conditions de vente.",
  );

  const clientHtml = emailShell({
    tone: "red",
    heroIcon: "hero-alert-triangle",
    bannerHeadline: "Facture en retard de paiement",
    bodyGreetingName: buyer,
    bodyIntro:
      "Notre système indique que le paiement de la facture ci-dessous n'a pas été reçu à la date d'échéance prévue. Merci de régulariser la situation dans les meilleurs délais.",
    rows,
    calloutHtml: callout,
    attachmentLabel: "Facture PDF en pièce jointe",
    // ctaLabel: "Télécharger la facture",
    closingHtml:
      'Une question ou un paiement déjà effectué&nbsp;? <a href="mailto:leprestigieuxv@gmail.com" style="color:#1e5fbf;text-decoration:underline;">Contactez l\'agence</a>.',
  });

  const pdf = await generateInvoicePdf(invoice.id, params.requestedByUserId);
  const clientAttachments = [
    ...emailIconAttachments(),
    { filename: `${number}.pdf`, content: pdf, contentType: "application/pdf" },
  ];

  const client = await sendTrackedMail({
    to,
    subject: `PrestiX - Rappel : facture ${number} en retard`,
    text:
      `Bonjour ${buyer},\n\n` +
      `La facture ${number} d'un montant de ${money(invoice.totalAmount)} est en retard de paiement ` +
      `depuis le ${dueDateLabel} (${params.daysOverdue} jour(s)). Merci de regulariser au plus vite.\n\n` +
      "PrestiX",
    html: clientHtml,
    attachments: clientAttachments,
    templateKey: "invoice_overdue_reminder",
    sourceType: "invoices",
    sourceId: String(invoice.id),
    metadata: {
      ...documentMetadata("invoice", invoice.id, invoice.number, params.trigger),
      daysOverdue: params.daysOverdue,
      audience: "client",
    },
  });

  if (client.success) await auditDocumentEmail("invoice", invoice.id, params.requestedByUserId);

  // Owner cc — internal notice, no PDF attachment needed (owners have full
  // app access), lighter payload, distinct templateKey so outbox filtering
  // can separate client-facing sends from internal ones.
  const ownerEmails = await listOwnerEmails();
  const ownerHtml = emailShell({
    tone: "red",
    heroIcon: "hero-alert-triangle",
    bannerHeadline: "Facture client en retard",
    bodyGreetingName: "équipe",
    bodyIntro: `La facture <strong>${escapeHtml(number)}</strong> du client <strong>${escapeHtml(buyer)}</strong> est en retard de paiement. Un rappel vient d'être envoyé au client.`,
    rows,
    closingHtml: "Notification interne automatique — PrestiX.",
  });

  const owners: SendTrackedMailResult[] = [];
  for (const ownerEmail of ownerEmails) {
    if (ownerEmail === to) continue; // avoid double-send if an admin's email matches the party record
    const result = await sendTrackedMail({
      to: ownerEmail,
      subject: `PrestiX - [Interne] Facture ${number} en retard`,
      text: `La facture ${number} du client ${buyer} est en retard de ${params.daysOverdue} jour(s). Montant du : ${money(invoice.totalAmount)}.`,
      html: ownerHtml,
      attachments: emailIconAttachments(),
      templateKey: "invoice_overdue_reminder_owner",
      sourceType: "invoices",
      sourceId: String(invoice.id),
      metadata: {
        ...documentMetadata("invoice", invoice.id, invoice.number, params.trigger),
        daysOverdue: params.daysOverdue,
        audience: "owner",
      },
    });
    owners.push(result);
  }

  return { client, owners };
}

export async function sendProformaEmail(
  params: SendDocumentEmailParams,
): Promise<SendTrackedMailResult> {
  const proforma = await getProformaById(params.id);
  if (proforma.status !== "draft") throw new Error("PROFORMA_NOT_SENDABLE");

  const to = recipientEmail(proforma.partySnapshot, params.to);
  const buyer = partyName(proforma.partySnapshot);
  const total = proforma.lines.reduce((sum, line) => sum + Number(line.lineTotal), 0);
  const pdf = await generateProformaPdf(proforma.id, params.requestedByUserId);

  const rows: InfoRow[] = [
    {
      icon: "file-invoice-navy",
      label: "Proforma",
      value: escapeHtml(proforma.number),
      emphasis: "blue",
    },
    { icon: "user-navy", label: "Client", value: escapeHtml(buyer) },
    {
      icon: "calendar-event-navy",
      label: "Date d'émission",
      value: escapeHtml(fmtDateLong(proforma.createdAt)),
    },
    {
      icon: "calendar-due-navy",
      label: "Validité",
      value: escapeHtml(fmtDateLong(proforma.expiresAt)),
      emphasis: "gold",
    },
    {
      icon: "coin-navy",
      label: "Montant total",
      value: escapeHtml(money(total)),
      emphasis: "gold",
    },
    { icon: "info-circle-navy", label: "Statut", value: statusPill("À confirmer") },
  ];

  const html = emailShell({
    tone: "blue",
    heroIcon: "hero-receipt",
    bannerHeadline: "Votre proforma est disponible",
    bodyGreetingName: buyer,
    bodyIntro:
      "Nous vous prions de trouver ci-joint la proforma préparée pour votre réservation. Elle reste valable jusqu'à la date de validité indiquée ci-dessous.",
    rows,
    attachmentLabel: "Proforma PDF en pièce jointe",
    // ctaLabel: "Télécharger la proforma",
    closingHtml: "Merci de votre confiance.",
  });

  const result = await sendTrackedMail({
    to,
    subject: `PrestiX - Proforma ${proforma.number}`,
    text:
      `Bonjour ${buyer},\n\n` +
      `Veuillez trouver en piece jointe votre proforma ${proforma.number} d'un montant de ${money(total)}.\n\n` +
      "Merci pour votre confiance.\nPrestiX",
    html,
    attachments: [
      ...emailIconAttachments(),
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
  const number = deliveryNote.number ?? `BL-${deliveryNote.id}`;
  const invoiceNumber = invoice.number ?? String(invoice.id);
  const pdf = await generateDeliveryNotePdf(invoice.id, params.requestedByUserId);

  const rows: InfoRow[] = [
    {
      icon: "file-invoice-navy",
      label: "Bon de livraison",
      value: escapeHtml(number),
      emphasis: "blue",
    },
    { icon: "user-navy", label: "Client", value: escapeHtml(buyer) },
    {
      icon: "file-invoice-navy",
      label: "Facture liée",
      value: escapeHtml(invoiceNumber),
      emphasis: "gold",
    },
    {
      icon: "calendar-event-navy",
      label: "Date d'émission",
      value: escapeHtml(fmtDateLong(deliveryNote.issuedAt)),
    },
    {
      icon: "coin-navy",
      label: "Montant facture",
      value: escapeHtml(money(invoice.totalAmount)),
      emphasis: "gold",
    },
    { icon: "info-circle-navy", label: "Statut", value: statusPill("Document joint") },
  ];

  const html = emailShell({
    tone: "blue",
    heroIcon: "hero-receipt",
    bannerHeadline: "Votre bon de livraison est disponible",
    bodyGreetingName: buyer,
    bodyIntro:
      "Nous vous prions de trouver ci-joint le bon de livraison préparé pour votre réservation, rattaché à la facture référencée ci-dessous.",
    rows,
    attachmentLabel: "Bon de livraison PDF en pièce jointe",
    // ctaLabel: "Télécharger le document",
    closingHtml: "Merci de votre confiance.",
  });

  const result = await sendTrackedMail({
    to,
    subject: `PrestiX - Bon de livraison ${number}`,
    text:
      `Bonjour ${buyer},\n\n` +
      `Veuillez trouver en piece jointe votre bon de livraison ${number}, rattache a la facture ${invoiceNumber}.\n\nPrestiX`,
    html,
    attachments: [
      ...emailIconAttachments(),
      { filename: `${number}.pdf`, content: pdf, contentType: "application/pdf" },
    ],
    templateKey: "delivery_note_pdf",
    sourceType: "delivery_notes",
    sourceId: String(deliveryNote.id),
    metadata: documentMetadata(
      "delivery_note",
      deliveryNote.id,
      deliveryNote.number,
      params.trigger,
    ),
  });

  if (result.success) {
    await auditDocumentEmail("delivery_note", deliveryNote.id, params.requestedByUserId);
  }
  return result;
}
