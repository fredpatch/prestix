export interface PartyHistoryPage<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PartyHistoryEpargneEntry {
  id: number;
  nature: "deposit" | "withdraw";
  totalAmount: string;
  status: "draft" | "recorded";
  receiptNumber?: string;
  reversalOfTransactionId?: number;
  appliedToInvoiceId?: number;
  recordedAt?: Date;
}

export interface PartyHistoryCommercialEntry {
  id: number;
  docType: "proforma" | "invoice";
  number?: string;
  status: string;
  date: Date;
  amount: string;
}

export interface PartyHistoryResult {
  commercial: PartyHistoryPage<PartyHistoryCommercialEntry>;
  epargne: PartyHistoryPage<PartyHistoryEpargneEntry>;
}

export interface PartyHistoryFilters {
  page?: number;
  pageSize?: number;
  epargnePage?: number;
  epargnePageSize?: number;
}
