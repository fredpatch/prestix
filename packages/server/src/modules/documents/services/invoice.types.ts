export interface InvoiceLineInput {
  lineType: "ticket" | "shop";
  description: string;
  quantity?: number;
  unitPrice: number;
  discount?: number;
}

export interface InvoiceLineView {
  id: number;
  lineType: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  lineTotal: string;
}

export interface InvoiceView {
  id: number;
  number?: string;
  proformaId?: number;
  partyId: number;
  referrerPartyId?: number;
  partySnapshot: Record<string, unknown>;
  status: "draft" | "issued" | "expired" | "cancelled";
  totalAmount: string;
  totalDiscount: string;
  dueDate?: string;
  issuedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  lines: InvoiceLineView[];
}

export interface CreateDraftInvoiceParams {
  partyId: number;
  referrerPartyId?: number;
  lines: InvoiceLineInput[];
  createdByUserId: number;
}

export interface PaymentPlanInput {
  mode: "full" | "installments";
  installments?: { expectedDate: string; expectedAmount: number }[]; // required if mode === "installments"
}

export interface IssueInvoiceParams {
  invoiceId: number;
  requestId: string;
  userId: number;
  paymentPlan: PaymentPlanInput;
}

export interface CancelInvoiceParams {
  invoiceId: number;
  reason: string;
  userId: number;
}
