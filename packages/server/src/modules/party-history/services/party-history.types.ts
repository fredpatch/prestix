export interface PartyHistoryPage<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PartyHistoryResult {
  commercial: PartyHistoryPage<unknown>; // filled in Sprint 3 once invoices (M4) exist
  epargne: PartyHistoryPage<unknown>; // filled in Sprint 9 once savings_transactions (M11) exist
}

export interface PartyHistoryFilters {
  page?: number;
  pageSize?: number;
  epargnePage?: number;
  epargnePageSize?: number;
}
