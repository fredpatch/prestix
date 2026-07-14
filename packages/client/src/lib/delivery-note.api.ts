import api from "./axios";

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
};
