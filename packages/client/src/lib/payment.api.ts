import api from "./axios";

export interface Payment {
  id: number;
  invoiceId: number;
  installmentId?: number;
  amountTendered: string;
  amountApplied: string;
  changeGiven: string;
  creditedAmount: string;
  method: string;
  allocationTarget?: string;
  agentId: number;
  createdAt: string;
}

export interface Installment {
  id: number;
  invoiceId: number;
  sequence: number;
  expectedDate: string;
  expectedAmount: string;
  paidAmount: string;
  status: "unpaid" | "partial" | "paid";
  penaltyAccrued: string;
  penaltyPaid: string;
  penaltyDue: string;
  rescheduledFrom?: string;
  rescheduledReason?: string;
}

export interface RecordPaymentInput {
  amountTendered: number;
  method: "cash" | "mobile_money" | "virement" | "credit" | "epargne";
  targetInstallmentId?: number;
  overpaymentChoice?: "change" | "credit";
  allocationTarget?: "principal" | "penalty";
}

export const paymentApi = {
  listByInvoice: (invoiceId: number) => api.get<Payment[]>(`/payments/invoice/${invoiceId}`),
  listInstallments: (invoiceId: number) =>
    api.get<Installment[]>(`/payments/invoice/${invoiceId}/installments`),
  record: (invoiceId: number, data: RecordPaymentInput) =>
    api.post<Payment[]>(`/payments/invoice/${invoiceId}`, data),
  reschedule: (installmentId: number, newDate: string, reason: string) =>
    api.patch<Installment>(`/payments/installments/${installmentId}/reschedule`, {
      newDate,
      reason,
    }),
};
