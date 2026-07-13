import api from "./axios";

export interface Party {
  id: number;
  code?: string;
  fullName: string;
  isClient: boolean;
  isReferrer: boolean;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartyFilters {
  search?: string;
  isClient?: boolean;
  isReferrer?: boolean;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreatePartyData {
  code?: string;
  fullName: string;
  isClient?: boolean;
  isReferrer?: boolean;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PartyHistoryPage<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PartyHistory {
  commercial: PartyHistoryPage;
  epargne: PartyHistoryPage;
}

export const partyApi = {
  list: (filters: PartyFilters = {}) =>
    api.get<{ data: Party[]; total: number }>("/parties", { params: filters }),
  getById: (id: number) => api.get<Party>(`/parties/${id}`),
  create: (data: CreatePartyData) => api.post<Party>("/parties", data),
  update: (id: number, data: Partial<CreatePartyData>) => api.patch<Party>(`/parties/${id}`, data),
  toggleActivation: (id: number, active: boolean) =>
    api.patch<Party>(`/parties/${id}/activation`, { active }),
  getHistory: (id: number, params: { page?: number; epargnePage?: number } = {}) =>
    api.get<PartyHistory>(`/parties/${id}/history`, { params }),
};
