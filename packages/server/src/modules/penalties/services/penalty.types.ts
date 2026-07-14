export interface PenaltyView {
  id: number;
  invoiceId: number;
  installmentId: number;
  amountXaf: string;
  graceWeeks: number;
  accruedAt: Date;
  voidedAt?: Date;
  voidedReason?: string;
}

export interface CreanceRow {
  invoiceId: number;
  invoiceNumber?: string;
  partyId: number;
  partyName: string;
  installmentId: number;
  sequence: number;
  expectedDate: string;
  expectedAmount: string;
  principalPaid: string;
  principalDue: string;
  penaltyAccrued: string;
  penaltyPaid: string;
  penaltyDue: string;
  isOverdue: boolean;
}
