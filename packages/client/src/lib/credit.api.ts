import api from "./axios";

export interface CreditLot {
  id: number;
  partyId: number;
  amount: string;
  remainingAmount: string;
  sourceInvoiceId?: number;
  decisionWindowExpiresAt: string;
  convertedAt?: string;
  createdAt: string;
}

export interface CreditLotEntry {
  id: number;
  lotId: number;
  entryType: "spend" | "refund" | "convert_to_epargne";
  amount: string;
  refType?: string;
  refId?: string;
  createdAt: string;
}

export const creditApi = {
  getBalance: (partyId: number) =>
    api.get<{ partyId: number; balance: number }>(`/credit/party/${partyId}/balance`),
  listLots: (partyId: number) => api.get<CreditLot[]>(`/credit/party/${partyId}/lots`),
  listEntries: (lotId: number) => api.get<CreditLotEntry[]>(`/credit/lots/${lotId}/entries`),
  refund: (lotId: number, amount: number) => api.post(`/credit/lots/${lotId}/refund`, { amount }),
};
