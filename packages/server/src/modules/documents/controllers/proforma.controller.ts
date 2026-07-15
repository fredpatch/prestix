import { Request, Response } from "express";
import * as proformaService from "../services/proforma.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    PROFORMA_NOT_FOUND: 404,
    PARTY_NOT_FOUND: 404,
    PROFORMA_NEEDS_AT_LEAST_ONE_LINE: 400,
    DISCOUNT_REQUIRES_MANAGER: 403,
    DISCOUNT_CANNOT_BE_NEGATIVE: 400,
    DISCOUNT_EXCEEDS_LINE_AMOUNT: 400,
    PROFORMA_NOT_EDITABLE: 400,
    PROFORMA_ALREADY_PROMOTED: 400,
    PROFORMA_LINE_NOT_FOUND: 404,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[proforma]", error);
  res.status(code).json({ message, code: message });
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const partyId = req.query.partyId ? parseInt(req.query.partyId as string) : undefined;
    res.json(await proformaService.listProformas(partyId));
  } catch (error) {
    handleError(res, error);
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    res.json(await proformaService.getProformaById(parseInt(req.params.id)));
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { partyId, referrerPartyId, lines } = req.body;

    if (!partyId || !Array.isArray(lines)) {
      res.status(400).json({ message: "partyId et lines sont requis." });
      return;
    }
    const proforma = await proformaService.createProforma({
      partyId,
      lines,
      createdByUserId: req.user!.userId,
      referrerPartyId,
    });
    res.status(201).json(proforma);
  } catch (error) {
    handleError(res, error);
  }
}

export async function addLine(req: Request, res: Response): Promise<void> {
  try {
    const proformaId = parseInt(req.params.id);
    const proforma = await proformaService.addProformaLine(proformaId, req.body, req.user!.userId);
    res.json(proforma);
  } catch (error) {
    handleError(res, error);
  }
}

export async function removeLine(req: Request, res: Response): Promise<void> {
  try {
    const proformaId = parseInt(req.params.id);
    const lineId = parseInt(req.params.lineId);
    const proforma = await proformaService.removeProformaLine(proformaId, lineId, req.user!.userId);
    res.json(proforma);
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateLine(req: Request, res: Response): Promise<void> {
  try {
    const proformaId = parseInt(req.params.id);
    const lineId = parseInt(req.params.lineId);
    const proforma = await proformaService.updateProformaLine(
      proformaId,
      lineId,
      req.body,
      req.user!.userId,
    );
    res.json(proforma);
  } catch (error) {
    handleError(res, error);
  }
}
