import { Request, Response } from "express";
import { generateProformaPdf } from "../services/proforma-pdf.service.js";

export async function download(req: Request, res: Response): Promise<void> {
  try {
    const proformaId = parseInt(req.params.id);
    const pdf = await generateProformaPdf(proformaId, req.user!.userId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="proforma-${proformaId}.pdf"`);
    res.send(pdf);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "PROFORMA_NOT_FOUND") {
      res.status(404).json({ message: "Proforma introuvable." });
      return;
    }
    console.error("[proforma-pdf]", error);
    res.status(500).json({ message: "Erreur lors de la génération du PDF." });
  }
}
