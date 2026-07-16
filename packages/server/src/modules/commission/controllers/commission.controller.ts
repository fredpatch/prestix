import { Request, Response } from "express";
import * as commissionService from "../services/commission.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    COMMISSION_TYPE_NOT_ACTIVE: 400,
    COMMISSION_AMOUNT_MUST_BE_POSITIVE: 400,
    CLIENT_PARTY_NOT_FOUND: 404,
    REFERRER_PARTY_NOT_FOUND: 404,
    COMMISSION_TRANSACTION_NOT_FOUND: 404,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[commission]", error);
  res.status(code).json({ message, code: message });
}

// Records a new commission — any agent can log one directly, no approval
// workflow (matches the "autonomous" design: this is a same-day accounting
// entry for a service the agency already completed, not a quote awaiting
// anyone's sign-off).
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { type, clientPartyId, referrerPartyId, date, commissionAmount, details, note } = req.body;
    if (!type || !date || typeof commissionAmount !== "number") {
      res.status(400).json({ message: "type, date et commissionAmount sont requis." });
      return;
    }
    const commission = await commissionService.createCommissionTransaction({
      type,
      agentId: req.user!.userId,
      clientPartyId,
      referrerPartyId,
      date,
      commissionAmount,
      details,
      note,
    });
    res.status(201).json(commission);
  } catch (error) {
    handleError(res, error);
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { type, agentId, dateFrom, dateTo, includeInactive } = req.query;
    const commissions = await commissionService.listCommissionTransactions({
      type: type as string | undefined,
      agentId: agentId ? parseInt(agentId as string) : undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
      includeInactive: includeInactive === "true",
    });
    res.json(commissions);
  } catch (error) {
    handleError(res, error);
  }
}

// admin+ — same privilege level as invoice cancellation, since both quietly
// remove a row from CA/gain reporting and deserve the same scrutiny.
export async function softDelete(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const commission = await commissionService.softDeleteCommissionTransaction(id, req.user!.userId);
    res.json(commission);
  } catch (error) {
    handleError(res, error);
  }
}
