import { Request, Response } from "express";
import * as partyService from "../services/party.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    PARTY_NOT_FOUND: 404,
    PARTY_NEEDS_A_ROLE: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[party]", error);
  res.status(code).json({ message, code: message });
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { search, isClient, isReferrer, active, page, pageSize } = req.query;
    const result = await partyService.listParties({
      search: search as string | undefined,
      isClient: isClient !== undefined ? isClient === "true" : undefined,
      isReferrer: isReferrer !== undefined ? isReferrer === "true" : undefined,
      active: active !== undefined ? active === "true" : undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const party = await partyService.getPartyById(parseInt(req.params.id));
    res.json(party);
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { code, fullName, isClient, isReferrer, phone, email, address } = req.body;
    if (!fullName) {
      res.status(400).json({ message: "Le nom complet est requis." });
      return;
    }
    const party = await partyService.createParty({
      code,
      fullName,
      isClient,
      isReferrer,
      phone,
      email,
      address,
      createdByUserId: req.user!.userId,
    });
    res.status(201).json(party);
  } catch (error) {
    handleError(res, error);
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { code, fullName, isClient, isReferrer, phone, email, address } = req.body;
    const party = await partyService.updateParty(parseInt(req.params.id), {
      code,
      fullName,
      isClient,
      isReferrer,
      phone,
      email,
      address,
      updatedByUserId: req.user!.userId,
    });
    res.json(party);
  } catch (error) {
    handleError(res, error);
  }
}

export async function toggleActivation(req: Request, res: Response): Promise<void> {
  try {
    const { active } = req.body;
    if (typeof active !== "boolean") {
      res.status(400).json({ message: "Le champ 'active' doit être un booléen." });
      return;
    }
    const party = await partyService.toggleActivation(
      parseInt(req.params.id),
      active,
      req.user!.userId,
    );
    res.json(party);
  } catch (error) {
    handleError(res, error);
  }
}
