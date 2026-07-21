export interface PartyView {
  id: number;
  code?: string;
  fullName: string;
  isClient: boolean;
  isReferrer: boolean;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartyFilters {
  search?: string;
  isClient?: boolean;
  isReferrer?: boolean;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PartyStats {
  total: number;
  clients: number;
  referrers: number;
  clientAndReferrer: number;
  active: number;
  inactive: number;
}

export interface CreatePartyParams {
  code?: string;
  fullName: string;
  isClient?: boolean;
  isReferrer?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  createdByUserId: number;
}

export interface UpdatePartyParams {
  code?: string;
  fullName?: string;
  isClient?: boolean;
  isReferrer?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  updatedByUserId: number;
}
