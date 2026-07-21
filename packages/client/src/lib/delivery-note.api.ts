import api from "./axios";
import type { DocumentEmailResult } from "./invoice.api";

export interface DeliveryNote {
  id: number;
  number?: string;
  invoiceId: number;
  issuedAt: string;
}

export const deliveryNoteApi = {
  create: (invoiceId: number) => api.post<DeliveryNote>(`/delivery-notes/invoice/${invoiceId}`),
  getByInvoice: (invoiceId: number) =>
    api.get<DeliveryNote>(`/delivery-notes/invoice/${invoiceId}`),
  sendEmail: (invoiceId: number, to?: string) =>
    api.post<DocumentEmailResult>(`/delivery-notes/invoice/${invoiceId}/email`, { to }, { timeout: 60_000 }),
};
