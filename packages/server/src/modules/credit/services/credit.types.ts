export type CreditEntryType = "spend" | "refund" | "convert_to_epargne";

export interface CreditLotView {
  id: number;
  partyId: number;
  amount: string;
  remainingAmount: string;
  sourceInvoiceId?: number;
  decisionWindowExpiresAt: Date;
  convertedAt?: Date;
  createdAt: Date;
}

export interface CreditLotEntryView {
  id: number;
  lotId: number;
  entryType: CreditEntryType;
  amount: string;
  refType?: string;
  refId?: string;
  createdAt: Date;
}

export interface CreatePartyCreditParams {
  partyId: number;
  amount: number;
  sourceInvoiceId?: number;
  userId: number;
}

export interface SpendCreditParams {
  partyId: number;
  amount: number;
  refType: string;
  refId: string;
  userId: number;
}

export interface RefundCreditLotParams {
  lotId: number;
  amount: number;
  userId: number;
}
