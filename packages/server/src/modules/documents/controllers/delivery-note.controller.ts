import { Request, Response } from "express";
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

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    const bl = await deliveryNoteService.createDeliveryNote(invoiceId, req.user!.userId);
    res.status(201).json(bl);
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
