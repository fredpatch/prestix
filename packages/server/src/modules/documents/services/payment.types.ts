export interface RecordPaymentParams {
  invoiceId: number;
  amountTendered: number;
  method: "cash" | "mobile_money" | "virement" | "credit" | "epargne";
  agentId: number;
  targetInstallmentId?: number; // agent override; FIFO if omitted
  overpaymentChoice?: "change" | "credit"; // required only if this payment overpays
  allocationTarget?: "principal" | "penalty"; // M6: agent's principal-first vs penalty-first choice, defaults to principal
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
  penaltyAccrued: string; // M6: sum of non-voided penalty rows for this installment
  penaltyPaid: string;
  penaltyDue: string;
  rescheduledFrom?: string;
  rescheduledReason?: string;
}

export interface RescheduleParams {
  installmentId: number;
  newDate: string;
  reason: string;
  userId: number;
}
