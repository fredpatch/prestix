import api from "./axios";
import type { DocumentLineInput, DocumentLineView } from "./proforma.api";

export interface Invoice {
  id: number;
  number?: string;
  proformaId?: number;
  partyId: number;
  referrerPartyId?: number;
  partySnapshot: { fullName?: string; phone?: string; email?: string };
  status: "draft" | "issued" | "expired" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  totalAmount: string;
  totalDiscount: string;
  dueDate?: string;
  issuedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  lines: DocumentLineView[];
}

export interface PaymentPlanInput {
  mode: "full" | "installments";
  installments?: { expectedDate: string; expectedAmount: number }[];
}

export const invoiceApi = {
  list: (partyId?: number) => api.get<Invoice[]>("/invoices", { params: { partyId } }),
  getById: (id: number) => api.get<Invoice>(`/invoices/${id}`),
  createDraft: (partyId: number, lines: DocumentLineInput[], referrerPartyId?: number) =>
    api.post<Invoice>("/invoices", { partyId, referrerPartyId, lines }),
  promoteFromProforma: (proformaId: number) =>
    api.post<Invoice>(`/invoices/from-proforma/${proformaId}`),
  addLine: (invoiceId: number, line: DocumentLineInput) =>
    api.post<Invoice>(`/invoices/${invoiceId}/lines`, line),
  removeLine: (invoiceId: number, lineId: number) =>
    api.delete<Invoice>(`/invoices/${invoiceId}/lines/${lineId}`),
  issue: (
    invoiceId: number,
    requestId: string,
    paymentPlan: PaymentPlanInput,
    allowNegativeStockOverride?: boolean,
  ) =>
    api.post<Invoice>(`/invoices/${invoiceId}/issue`, {
      requestId,
      paymentPlan,
      allowNegativeStockOverride,
    }),
  cancel: (invoiceId: number, reason: string) =>
    api.post<Invoice>(`/invoices/${invoiceId}/cancel`, { reason }),
};
