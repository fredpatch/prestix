import { Request, Response } from "express";
import * as savingsService from "../services/savings.service.js";
import { convertExpiredCreditLots } from "../services/savings-conversion.service.js";
import { generateWithdrawalReceiptPdf } from "../../documents/services/receipt-pdf.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    PARTY_NOT_FOUND: 404,
    SAVINGS_ACCOUNT_NOT_FOUND: 404,
    SAVINGS_ACCOUNT_ALREADY_EXISTS: 409,
    SAVINGS_AMOUNT_MUST_BE_POSITIVE: 400,
    INSUFFICIENT_EPARGNE_BALANCE: 400,
    SAVINGS_TRANSACTION_NOT_FOUND: 404,
    ONLY_RECORDED_TRANSACTIONS_CAN_BE_REVERSED: 400,
    TRANSACTION_ALREADY_REVERSED: 409,
    REVERSAL_REASON_REQUIRED: 400,
    RECEIPT_ONLY_FOR_WITHDRAWALS: 400,
    NO_RECEIPT_FOR_THIS_TRANSACTION: 404,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[savings]", error);
  res.status(code).json({ message, code: message });
}

// agent+ — opening a direct subscription is a routine counter action (client
// hands over the inscription fee, agent opens the account), no special
// privilege needed. The privileged action in this module is withdrawal, not
// account creation.
export async function subscribe(req: Request, res: Response): Promise<void> {
  try {
    const { partyId } = req.body;
    if (!partyId) {
      res.status(400).json({ message: "partyId est requis." });
      return;
    }
    const account = await savingsService.createDirectSubscription({ partyId, agentId: req.user!.userId });
    res.status(201).json(account);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getAccountByParty(req: Request, res: Response): Promise<void> {
  try {
    const partyId = parseInt(req.params.partyId);
    const account = await savingsService.getAccountByParty(partyId);
    if (!account) {
      res.status(404).json({ message: "Aucun compte épargne pour cette partie." });
      return;
    }
    res.json(account);
  } catch (error) {
    handleError(res, error);
  }
}

export async function listTransactions(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseInt(req.params.accountId);
    const transactions = await savingsService.listTransactionsForAccount(accountId);
    res.json(transactions);
  } catch (error) {
    handleError(res, error);
  }
}

export async function deposit(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseInt(req.params.accountId);
    const { amount, quantity } = req.body;
    if (typeof amount !== "number") {
      res.status(400).json({ message: "amount est requis." });
      return;
    }
    const transaction = await savingsService.recordDeposit({
      accountId,
      amount,
      quantity,
      agentId: req.user!.userId,
    });
    res.status(201).json(transaction);
  } catch (error) {
    handleError(res, error);
  }
}

// manager+ (route-gated) — the one privileged action in this module, per
// spec ("Withdrawal: manager+, balance-guarded").
export async function withdraw(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseInt(req.params.accountId);
    const { amount, quantity } = req.body;
    if (typeof amount !== "number") {
      res.status(400).json({ message: "amount est requis." });
      return;
    }
    const transaction = await savingsService.recordWithdrawal({
      accountId,
      amount,
      quantity,
      agentId: req.user!.userId,
    });
    res.status(201).json(transaction);
  } catch (error) {
    handleError(res, error);
  }
}

// admin+ — reversal is the one correction mechanism for an immutable
// recorded transaction, deserves the same privilege bar as invoice
// cancellation and penalty voiding elsewhere in the app.
export async function reverse(req: Request, res: Response): Promise<void> {
  try {
    const transactionId = parseInt(req.params.transactionId);
    const { reason } = req.body;
    const transaction = await savingsService.reverseTransaction({
      transactionId,
      reason,
      userId: req.user!.userId,
    });
    res.json(transaction);
  } catch (error) {
    handleError(res, error);
  }
}

// super_admin — manual trigger for the auto-conversion cron, same pattern as
// Sprint 5's penalty accrual manual trigger: legitimate standing admin
// feature (force a check after fixing a settings mistake), not just a test
// hook, and genuinely useful for testing this without waiting on real credit-
// lot expiry windows.
export async function triggerConversion(req: Request, res: Response): Promise<void> {
  try {
    const result = await convertExpiredCreditLots();
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export async function downloadReceipt(req: Request, res: Response): Promise<void> {
  try {
    const transactionId = parseInt(req.params.transactionId);
    const pdf = await generateWithdrawalReceiptPdf(transactionId, req.user!.userId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="recu-${transactionId}.pdf"`);
    res.send(pdf);
  } catch (error) {
    handleError(res, error);
  }
}
