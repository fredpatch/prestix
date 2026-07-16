import { Request, Response } from "express";
import * as editService from "../services/commission-edit.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    EDIT_REASON_REQUIRED: 400,
    COMMISSION_TRANSACTION_NOT_FOUND: 404,
    EDIT_REQUEST_ALREADY_PENDING: 409,
    COMMISSION_AMOUNT_MUST_BE_POSITIVE: 400,
    EDIT_REQUEST_NOT_FOUND: 404,
    EDIT_REQUEST_NOT_PENDING: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[commission-edit]", error);
  res.status(code).json({ message, code: message });
}

// agent+ — anyone can PROPOSE a correction; only the review step below is
// privileged. This is deliberate: catching your own mistake and flagging it
// should never require asking someone else to type it in for you.
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const commissionTransactionId = parseInt(req.params.id);
    const { reason, proposedChanges } = req.body;
    if (!reason || !proposedChanges) {
      res.status(400).json({ message: "reason et proposedChanges sont requis." });
      return;
    }
    const request = await editService.createEditRequest({
      commissionTransactionId,
      requestedBy: req.user!.userId,
      reason,
      proposedChanges,
    });
    res.status(201).json(request);
  } catch (error) {
    handleError(res, error);
  }
}

// admin+ — the review queue itself. Defaults to pending-only unless a status
// is explicitly requested, since "what needs my attention" is the common case.
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const status = (req.query.status as "pending" | "approved" | "rejected" | undefined) ?? "pending";
    const requests = await editService.listEditRequests({ status });
    res.json(requests);
  } catch (error) {
    handleError(res, error);
  }
}

export async function approve(req: Request, res: Response): Promise<void> {
  try {
    const requestId = parseInt(req.params.requestId);
    const request = await editService.approveEditRequest(requestId, req.user!.userId);
    res.json(request);
  } catch (error) {
    handleError(res, error);
  }
}

export async function reject(req: Request, res: Response): Promise<void> {
  try {
    const requestId = parseInt(req.params.requestId);
    const { reviewNote } = req.body;
    const request = await editService.rejectEditRequest(requestId, req.user!.userId, reviewNote);
    res.json(request);
  } catch (error) {
    handleError(res, error);
  }
}
