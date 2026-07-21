import { Request, Response } from "express";
import { getBoolValue } from "@/modules/settings/services/settings.service.js";
import * as invoiceService from "../services/invoice.service.js";
import { roleLevel } from "../../../db/schema.js";
import { sendInvoiceEmail } from "../services/document-email.service.js";

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
    INVALID_INSTALLMENT_COUNT: 400,
    INSTALLMENTS_MUST_SUM_TO_TOTAL: 400,
    STOCK_ARTICLE_NOT_FOUND: 404,
    MOVEMENT_ALREADY_RECORDED: 409,
    INSUFFICIENT_STOCK: 400,
    NEGATIVE_STOCK_OVERRIDE_REQUIRES_MANAGER: 403,
    INVOICE_LINE_NOT_FOUND: 404,
    INVOICE_LOCKED_FROM_PROFORMA: 400,
    PROFORMA_ALREADY_PROMOTED: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[invoice]", error);
  res.status(code).json({ message, code: message });
}

async function queueAutomaticInvoiceEmail(invoiceId: number, userId: number): Promise<void> {
  try {
    const enabled = await getBoolValue("mail_document_auto_send_enabled", false);
    if (!enabled) return;
    const result = await sendInvoiceEmail({
      id: invoiceId,
      requestedByUserId: userId,
      trigger: "automatic",
    });
    if (!result.success) {
      console.warn("[invoice:auto-email]", result.errorMessage ?? "MAIL_SEND_FAILED");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message !== "RECIPIENT_EMAIL_REQUIRED") console.warn("[invoice:auto-email]", error);
  }
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

export async function updateLine(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.id);
    const lineId = parseInt(req.params.lineId);
    const invoice = await invoiceService.updateLine(invoiceId, lineId, req.body, req.user!.userId);
    res.json(invoice);
  } catch (error) {
    handleError(res, error);
  }
}

export async function issue(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.id);
    const { requestId, paymentPlan, allowNegativeStockOverride } = req.body;
    if (!requestId) {
      res.status(400).json({ message: "requestId est requis (idempotence)." });
      return;
    }
    if (!paymentPlan) {
      res.status(400).json({ message: "paymentPlan est requis." });
      return;
    }
    const wantsNegativeOverride = allowNegativeStockOverride === true;
    const userRole = req.user!.role as keyof typeof roleLevel;
    const isManagerPlus = (roleLevel[userRole] ?? 0) >= roleLevel.manager;
    if (wantsNegativeOverride && !isManagerPlus) {
      throw new Error("NEGATIVE_STOCK_OVERRIDE_REQUIRES_MANAGER");
    }

    const invoice = await invoiceService.issueInvoice({
      invoiceId,
      requestId,
      userId: req.user!.userId,
      paymentPlan,
      allowNegativeStockOverride: wantsNegativeOverride,
    });
    res.json(invoice);
    void queueAutomaticInvoiceEmail(invoice.id, req.user!.userId);
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
