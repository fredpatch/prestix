import { Request, Response } from "express";
import * as paymentService from "../services/payment.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    INVOICE_NOT_FOUND: 404,
    INSTALLMENT_NOT_FOUND: 404,
    INVALID_AMOUNT: 400,
    INVOICE_NOT_ISSUED: 400,
    NO_PAYMENT_PLAN: 400,
    OVERPAYMENT_CHOICE_REQUIRED: 400,
    OVERPAYMENT_WITH_NOTHING_DUE: 400,
    RESCHEDULE_REASON_REQUIRED: 400,
    CANNOT_RESCHEDULE_PAID_INSTALLMENT: 400,
    RESCHEDULE_MUST_BE_FORWARD_ONLY: 400,
    NO_EPARGNE_ACCOUNT_FOR_PARTY: 400,
    INSUFFICIENT_EPARGNE_BALANCE: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[payment]", error);
  res.status(code).json({ message, code: message });
}

export async function record(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    const { amountTendered, method, targetInstallmentId, overpaymentChoice, allocationTarget } =
      req.body;

    if (typeof amountTendered !== "number" || !method) {
      res.status(400).json({ message: "amountTendered et method sont requis." });
      return;
    }
    const rows = await paymentService.recordPayment({
      invoiceId,
      amountTendered,
      method,
      targetInstallmentId,
      overpaymentChoice,
      agentId: req.user!.userId,
      allocationTarget,
    });
    res.status(201).json(rows);
  } catch (error) {
    handleError(res, error);
  }
}

export async function listByInvoice(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    res.json(await paymentService.listPaymentsByInvoice(invoiceId));
  } catch (error) {
    handleError(res, error);
  }
}

export async function listInstallments(req: Request, res: Response): Promise<void> {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    res.json(await paymentService.listInstallmentsByInvoice(invoiceId));
  } catch (error) {
    handleError(res, error);
  }
}

export async function reschedule(req: Request, res: Response): Promise<void> {
  try {
    const installmentId = parseInt(req.params.installmentId);
    const { newDate, reason } = req.body;
    const installment = await paymentService.rescheduleInstallment({
      installmentId,
      newDate,
      reason,
      userId: req.user!.userId,
    });
    res.json(installment);
  } catch (error) {
    handleError(res, error);
  }
}
