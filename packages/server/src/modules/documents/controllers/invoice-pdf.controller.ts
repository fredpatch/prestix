import { Request, Response } from "express";
import { generateInvoicePdf } from "../services/invoice-pdf.service.js";

export async function download(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.id);
    const pdf = await generateInvoicePdf(invoiceId, req.user!.userId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="facture-${invoiceId}.pdf"`);
    res.send(pdf);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "INVOICE_NOT_FOUND") {
      res.status(404).json({ message: "Facture introuvable." });
      return;
    }
    console.error("[invoice-pdf]", error);
    res.status(500).json({ message: "Erreur lors de la génération du PDF." });
  }
}
