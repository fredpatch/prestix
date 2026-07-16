import api from "./axios";

export interface SavingsAccount {
  id: number;
  partyId: number;
  currency: string;
  inscriptionFeeAmount: string;
  subscriptionSource: "direct" | "credit_conversion";
  sourceCreditLotId?: number;
  balance: string;
  createdAt: string;
}

export interface SavingsTransaction {
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
  agentId?: number;
  recordedAt?: string;
  createdAt: string;
}

export const savingsApi = {
  subscribe: (partyId: number) => api.post<SavingsAccount>("/savings/subscribe", { partyId }),
  getAccountByParty: (partyId: number) => api.get<SavingsAccount>(`/savings/party/${partyId}`),
  listTransactions: (accountId: number) => api.get<SavingsTransaction[]>(`/savings/${accountId}/transactions`),
  deposit: (accountId: number, amount: number, quantity?: number) =>
    api.post<SavingsTransaction>(`/savings/${accountId}/deposits`, { amount, quantity }),
  withdraw: (accountId: number, amount: number, quantity?: number) =>
    api.post<SavingsTransaction>(`/savings/${accountId}/withdrawals`, { amount, quantity }),
  reverse: (transactionId: number, reason: string) =>
    api.post<SavingsTransaction>(`/savings/transactions/${transactionId}/reverse`, { reason }),
  triggerConversion: () => api.post<{ converted: number; heldForReview: number }>("/savings/convert-expired-credit"),
};
