// M11 — Épargne Voyage. Two hard rules run through this whole module:
// 1. Balance is ALWAYS derived (Σ deposits − Σ withdrawals over `recorded`
//    rows), never a stored counter — same append-only-ledger philosophy as
//    M3's credit lots, M6's penalties, M9's stock movements.
// 2. A `recorded` transaction is immutable. There is no edit. The only way to
//    correct one is a reversal — a compensating entry in the opposite
//    direction, never a mutation of the original row.

export interface SavingsAccountView {
  id: number;
  partyId: number;
  currency: string;
  inscriptionFeeAmount: string;
  subscriptionSource: "direct" | "credit_conversion";
  sourceCreditLotId?: number;
  balance: string; // always derived at read time, never stored
  createdAt: Date;
}

export interface SavingsTransactionView {
  id: number;
  accountId: number;
  nature: "deposit" | "withdraw";
  amount: string;
  quantity: number;
  totalAmount: string;
  status: "draft" | "recorded";
  appliedToInvoiceId?: number;
  receiptNumber?: string;
  reversalOfTransactionId?: number;
  agentId?: number; // undefined for system-originated rows (M11 auto-conversion cron)
  recordedAt?: Date;
  createdAt: Date;
}

export interface CreateDirectSubscriptionParams {
  partyId: number;
  agentId: number;
}

export interface RecordDepositParams {
  accountId: number;
  amount: number;
  quantity?: number;
  agentId: number;
}

export interface RecordWithdrawalParams {
  accountId: number;
  amount: number;
  quantity?: number;
  agentId: number;
  appliedToInvoiceId?: number; // set when this withdrawal IS an épargne-as-payment, not a standalone one
}

export interface ReverseTransactionParams {
  transactionId: number;
  reason: string;
  userId: number;
}
