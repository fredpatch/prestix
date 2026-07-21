import { Request, Response } from "express";
import {
  sendDeliveryNoteEmail,
  sendInvoiceEmail,
  sendProformaEmail,
} from "../services/document-email.service.js";

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
