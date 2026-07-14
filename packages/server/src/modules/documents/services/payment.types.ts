export interface RecordPaymentParams {
  invoiceId: number;
  amountTendered: number;
  method: "cash" | "mobile_money" | "virement" | "credit" | "epargne";
  agentId: number;
  targetInstallmentId?: number; // agent override; FIFO if omitted
  overpaymentChoice?: "change" | "credit"; // required only if this payment overpays
}

export interface PaymentView {
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
  createdAt: Date;
}

export interface InstallmentView {
  id: number;
  invoiceId: number;
  sequence: number;
  expectedDate: string;
  expectedAmount: string;
  paidAmount: string; // derived, not stored
  status: "unpaid" | "partial" | "paid";
  rescheduledFrom?: string;
  rescheduledReason?: string;
}

export interface RescheduleParams {
  installmentId: number;
  newDate: string;
  reason: string;
  userId: number;
}
