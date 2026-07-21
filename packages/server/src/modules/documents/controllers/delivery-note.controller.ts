import { Request, Response } from "express";
import { getBoolValue } from "@/modules/settings/services/settings.service.js";
import { sendDeliveryNoteEmail } from "../services/document-email.service.js";
import * as deliveryNoteService from "../services/delivery-note.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    INVOICE_NOT_FOUND: 404,
    INVOICE_NOT_ISSUED: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[delivery-note]", error);
  res.status(code).json({ message, code: message });
}

async function queueAutomaticDeliveryNoteEmail(invoiceId: number, userId: number): Promise<void> {
  try {
    const enabled = await getBoolValue("mail_document_auto_send_enabled", false);
    if (!enabled) return;
    const result = await sendDeliveryNoteEmail({
      id: invoiceId,
      requestedByUserId: userId,
      trigger: "automatic",
    });
    if (!result.success) {
      console.warn("[delivery-note:auto-email]", result.errorMessage ?? "MAIL_SEND_FAILED");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message !== "RECIPIENT_EMAIL_REQUIRED") console.warn("[delivery-note:auto-email]", error);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    const bl = await deliveryNoteService.createDeliveryNote(invoiceId, req.user!.userId);
    res.status(201).json(bl);
    void queueAutomaticDeliveryNoteEmail(invoiceId, req.user!.userId);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getByInvoice(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    const bl = await deliveryNoteService.getByInvoiceId(invoiceId);
    if (!bl) {
      res.status(404).json({ message: "Aucun BL pour cette facture." });
      return;
    }
    res.json(bl);
  } catch (error) {
    handleError(res, error);
  }
}
