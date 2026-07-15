import api from "./axios";

export interface TicketDetailsInput {
  travelClass: "economy" | "business" | "first" | "premium";
  passengerName: string;
  segments: Array<{
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    flightNo?: string;
    tripType?: "one_way" | "round_trip";
  }>;
  references?: { pnr: string; gds: string; ticketNumber?: string };
  supplierPrice: number;
  sellingPrice: number;
}

export interface ShopDetailsInput {
  articleId?: number;
  supplierPrice: number;
  sellingPrice: number;
  passengerName?: string;
}

export interface DocumentLineInput {
  lineType: "ticket" | "shop";
  description: string;
  quantity?: number;
  unitPrice: number;
  discount?: number;
  ticketDetails?: TicketDetailsInput;
  shopDetails?: ShopDetailsInput;
}

export interface TicketDetailsView {
  id: number;
  travelClass: string;
  passengerName: string;
  segments: Array<{
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    flightNo?: string;
  }>;
  references?: { pnr: string; gds: string; ticketNumber?: string };
  supplierPrice: string;
  sellingPrice: string;
}

export interface ShopDetailsView {
  id: number;
  articleId?: number;
  supplierPrice: string;
  sellingPrice: string;
  passengerName?: string;
}

export interface DocumentLineView {
  id: number;
  lineType: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  lineTotal: string;
  ticketDetails?: TicketDetailsView;
  shopDetails?: ShopDetailsView;
}

export interface Proforma {
  id: number;
  number: string;
  partyId: number;
  referrerPartyId?: number;
  partySnapshot: { fullName?: string; phone?: string; email?: string };
  status: "draft" | "issued" | "expired" | "cancelled";
  expiresAt?: string;
  createdAt: string;
  lines: DocumentLineView[];
}

export const proformaApi = {
  list: (partyId?: number) => api.get<Proforma[]>("/proformas", { params: { partyId } }),
  getById: (id: number) => api.get<Proforma>(`/proformas/${id}`),
  create: (partyId: number, lines: DocumentLineInput[], referrerPartyId?: number) =>
    api.post<Proforma>("/proformas", { partyId, referrerPartyId, lines }),
  addLine: (proformaId: number, line: DocumentLineInput) =>
    api.post<Proforma>(`/proformas/${proformaId}/lines`, line),
  updateLine: (proformaId: number, lineId: number, patch: Partial<DocumentLineInput>) =>
    api.patch<Proforma>(`/proformas/${proformaId}/lines/${lineId}`, patch),
  removeLine: (proformaId: number, lineId: number) =>
    api.delete<Proforma>(`/proformas/${proformaId}/lines/${lineId}`),
};
