import { Request, Response } from "express";
import { generateDeliveryNotePdf } from "../services/delivery-note-pdf.service.js";

export async function download(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    const pdf = await generateDeliveryNotePdf(invoiceId, req.user!.userId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="bl-${invoiceId}.pdf"`);
    res.send(pdf);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "DELIVERY_NOTE_NOT_FOUND" || message === "INVOICE_NOT_FOUND") {
      res.status(404).json({ message: "Bon de livraison introuvable." });
      return;
    }
    console.error("[delivery-note-pdf]", error);
    res.status(500).json({ message: "Erreur lors de la génération du PDF." });
  }
}
