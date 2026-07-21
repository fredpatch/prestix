import { Request, Response } from "express";
import {
  sendDeliveryNoteEmail,
  sendInvoiceEmail,
  sendInvoiceReminderEmail,
  sendProformaEmail,
} from "../services/document-email.service.js";
import { getInvoiceById } from "../services/invoice.service.js";

// Whole days between dueDate and now, floored at 0 — a same-day or future
// due date never reads as "overdue" even if this route is called early.
function daysOverdue(dueDate: string | Date | null | undefined): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function requestedRecipient(req: Request): string | undefined {
  return typeof req.body?.to === "string" ? req.body.to.trim() : undefined;
}

function handleSendError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "DOCUMENT_EMAIL_FAILED";

  if (
    message === "INVOICE_NOT_FOUND" ||
    message === "PROFORMA_NOT_FOUND" ||
    message === "DELIVERY_NOTE_NOT_FOUND"
  ) {
    res.status(404).json({ message });
    return;
  }

  if (
    message === "RECIPIENT_EMAIL_REQUIRED" ||
    message === "INVOICE_NOT_ISSUED" ||
    message === "PROFORMA_NOT_SENDABLE" ||
    message === "INVOICE_ALREADY_PAID" ||
    message === "INVOICE_NOT_FULLY_PAID" ||
    message.startsWith("MAIL_") ||
    message.startsWith("SMTP_")
  ) {
    res.status(400).json({ message });
    return;
  }

  console.error("[document-email]", error);
  res.status(500).json({ message: "Erreur lors de l'envoi du document." });
}

export async function sendInvoice(req: Request, res: Response): Promise<void> {
  try {
    const result = await sendInvoiceEmail({
      id: parseInt(req.params.id),
      requestedByUserId: req.user!.userId,
      to: requestedRecipient(req),
    });
    res.json(result);
  } catch (error) {
    handleSendError(res, error);
  }
}

export async function sendProforma(req: Request, res: Response): Promise<void> {
  try {
    const result = await sendProformaEmail({
      id: parseInt(req.params.id),
      requestedByUserId: req.user!.userId,
      to: requestedRecipient(req),
    });
    res.json(result);
  } catch (error) {
    handleSendError(res, error);
  }
}

// Scenario #7 — manual "send reminder" action, e.g. a button on the invoice
// detail page. Sends the overdue-style email to the client and cc's every
// admin/super_admin, same content the automatic cron would produce.
export async function sendInvoiceReminder(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const invoice = await getInvoiceById(id);
    const result = await sendInvoiceReminderEmail({
      id,
      requestedByUserId: req.user!.userId,
      to: requestedRecipient(req),
      trigger: "manual",
      daysOverdue: daysOverdue(invoice.dueDate),
    });
    res.json(result);
  } catch (error) {
    handleSendError(res, error);
  }
}

export async function sendDeliveryNote(req: Request, res: Response): Promise<void> {
  try {
    const result = await sendDeliveryNoteEmail({
      id: parseInt(req.params.invoiceId),
      requestedByUserId: req.user!.userId,
      to: requestedRecipient(req),
    });
    res.json(result);
  } catch (error) {
    handleSendError(res, error);
  }
}
