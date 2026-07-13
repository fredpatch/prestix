import { Request, Response } from "express";
import * as creditService from "../services/credit.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    PARTY_NOT_FOUND: 404,
    CREDIT_LOT_NOT_FOUND: 404,
    INVALID_AMOUNT: 400,
    INSUFFICIENT_CREDIT_BALANCE: 400,
    REFUND_EXCEEDS_LOT_BALANCE: 400,
    CREDIT_LOT_ALREADY_CONVERTED: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[credit]", error);
  res.status(code).json({ message, code: message });
}

export async function getBalance(req: Request, res: Response): Promise<void> {
  try {
    const partyId = parseInt(req.params.partyId);
    const balance = await creditService.getPartyCreditBalance(partyId);
    res.json({ partyId, balance });
  } catch (error) {
    handleError(res, error);
  }
}

export async function listLots(req: Request, res: Response): Promise<void> {
  try {
    const partyId = parseInt(req.params.partyId);
    const lots = await creditService.listCreditLots(partyId);
    res.json(lots);
  } catch (error) {
    handleError(res, error);
  }
}

export async function listEntries(req: Request, res: Response): Promise<void> {
  try {
    const lotId = parseInt(req.params.lotId);
    const entries = await creditService.listLotEntries(lotId);
    res.json(entries);
  } catch (error) {
    handleError(res, error);
  }
}

export async function refund(req: Request, res: Response): Promise<void> {
  try {
    const lotId = parseInt(req.params.lotId);
    const { amount } = req.body;
    if (typeof amount !== "number") {
      res.status(400).json({ message: "Le montant est requis." });
      return;
    }
    await creditService.refundCreditLot({ lotId, amount, userId: req.user!.userId });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
