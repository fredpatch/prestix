import api from "./axios";

export interface DocumentLineInput {
  lineType: "ticket" | "shop";
  description: string;
  quantity?: number;
  unitPrice: number;
  discount?: number;
}

export interface DocumentLineView {
  id: number;
  lineType: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  lineTotal: string;
}

export interface Proforma {
  id: number;
  number: string;
  partyId: number;
  partySnapshot: { fullName?: string; phone?: string; email?: string };
  status: "draft" | "issued" | "expired" | "cancelled";
  expiresAt?: string;
  createdAt: string;
  lines: DocumentLineView[];
}

export const proformaApi = {
  list: (partyId?: number) => api.get<Proforma[]>("/proformas", { params: { partyId } }),
  getById: (id: number) => api.get<Proforma>(`/proformas/${id}`),
  create: (partyId: number, lines: DocumentLineInput[]) =>
    api.post<Proforma>("/proformas", { partyId, lines }),
};
