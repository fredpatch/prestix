import { Request, Response } from "express";
import * as partyHistoryService from "../services/party-history.service.js";

export async function get(req: Request, res: Response): Promise<void> {
  try {
    const partyId = parseInt(req.params.id);
    const { page, pageSize, epargnePage, epargnePageSize } = req.query;
    const result = await partyHistoryService.getPartyHistory(partyId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      epargnePage: epargnePage ? parseInt(epargnePage as string) : undefined,
      epargnePageSize: epargnePageSize ? parseInt(epargnePageSize as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "PARTY_NOT_FOUND") {
      res.status(404).json({ message: "Partie introuvable." });
      return;
    }
    console.error("[party-history]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}
