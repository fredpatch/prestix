import { Request, Response } from "express";
import * as invoiceService from "../services/invoice.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    INVOICE_NOT_FOUND: 404,
    PARTY_NOT_FOUND: 404,
    PROFORMA_NOT_FOUND: 404,
    INVOICE_NOT_DRAFT: 400,
    INVOICE_NEEDS_AT_LEAST_ONE_LINE: 400,
    INVOICE_HAS_NO_LINES: 400,
    PROFORMA_EXPIRED: 400,
    PROFORMA_CANCELLED: 400,
    PROFORMA_HAS_NO_LINES: 400,
    DISCOUNT_REQUIRES_MANAGER: 403,
    ONLY_ISSUED_INVOICES_CAN_BE_CANCELLED: 400,
    CANCEL_REASON_REQUIRED: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[invoice]", error);
  res.status(code).json({ message, code: message });
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const partyId = req.query.partyId ? parseInt(req.query.partyId as string) : undefined;
    res.json(await invoiceService.listInvoices(partyId));
  } catch (error) {
    handleError(res, error);
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    res.json(await invoiceService.getInvoiceById(parseInt(req.params.id)));
  } catch (error) {
    handleError(res, error);
  }
}

export async function createDraft(req: Request, res: Response): Promise<void> {
  try {
    const { partyId, referrerPartyId, lines } = req.body;

    if (!partyId || !Array.isArray(lines)) {
      res.status(400).json({ message: "partyId et lines sont requis." });
      return;
    }
    const invoice = await invoiceService.createDraftInvoice({
      partyId,
      lines,
      referrerPartyId,
      createdByUserId: req.user!.userId,
    });
    res.status(201).json(invoice);
  } catch (error) {
    handleError(res, error);
  }
}

export async function promoteFromProforma(req: Request, res: Response): Promise<void> {
  try {
    const proformaId = parseInt(req.params.proformaId);
    const invoice = await invoiceService.promoteProformaToInvoice(proformaId, req.user!.userId);
    res.status(201).json(invoice);
  } catch (error) {
    handleError(res, error);
  }
}

export async function addLine(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoice = await invoiceService.addLine(invoiceId, req.body, req.user!.userId);
    res.json(invoice);
  } catch (error) {
    handleError(res, error);
  }
}

export async function removeLine(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.id);
    const lineId = parseInt(req.params.lineId);
    const invoice = await invoiceService.removeLine(invoiceId, lineId, req.user!.userId);
    res.json(invoice);
  } catch (error) {
    handleError(res, error);
  }
}

export async function issue(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.id);
    const { requestId } = req.body;
    if (!requestId) {
      res.status(400).json({ message: "requestId est requis (idempotence)." });
      return;
    }
    const invoice = await invoiceService.issueInvoice({
      invoiceId,
      requestId,
      userId: req.user!.userId,
    });
    res.json(invoice);
  } catch (error) {
    handleError(res, error);
  }
}

export async function cancel(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.id);
    const { reason } = req.body;
    const invoice = await invoiceService.cancelInvoice({
      invoiceId,
      reason,
      userId: req.user!.userId,
    });
    res.json(invoice);
  } catch (error) {
    handleError(res, error);
  }
}
