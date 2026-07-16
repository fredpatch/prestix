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

export interface PartyHistoryResult {
  commercial: PartyHistoryPage<unknown>; // filled in Sprint 3 once invoices (M4) exist
  epargne: PartyHistoryPage<PartyHistoryEpargneEntry>;
}

export interface PartyHistoryFilters {
  page?: number;
  pageSize?: number;
  epargnePage?: number;
  epargnePageSize?: number;
}
