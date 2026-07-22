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

export interface DocumentEmailResult {
  success: boolean;
  outbox: {
    id: number;
    status: "pending" | "sent" | "failed";
    errorMessage?: string;
  };
  accepted: string[];
  rejected: string[];
  messageId?: string;
  errorMessage?: string;
}

// Reminder fans out to the client AND every admin/super_admin ("app owner"),
// as two separate tracked sends — surfaced distinctly so the UI can report
// "client notified" independently of "N owner(s) notified", since either
// side can fail on its own (bad party email vs. SMTP hiccup on an owner cc).
export interface ReminderResult {
  client: DocumentEmailResult;
  owners: DocumentEmailResult[];
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
  updateLine: (invoiceId: number, lineId: number, patch: Partial<DocumentLineInput>) =>
    api.patch<Invoice>(`/invoices/${invoiceId}/lines/${lineId}`, patch),
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
  sendEmail: (invoiceId: number, to?: string) =>
    api.post<DocumentEmailResult>(`/invoices/${invoiceId}/email`, { to }, { timeout: 60_000 }),
  sendReminder: (invoiceId: number, to?: string) =>
    api.post<ReminderResult>(`/invoices/${invoiceId}/send-reminder`, { to }, { timeout: 60_000 }),
};
