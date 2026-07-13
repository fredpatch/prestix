export interface ProformaLineInput {
  lineType: "ticket" | "shop";
  description: string;
  quantity?: number;
  unitPrice: number;
  discount?: number;
}

export interface ProformaLineView {
  id: number;
  lineType: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  lineTotal: string;
}

export interface ProformaView {
  id: number;
  number: string;
  partyId: number;
  partySnapshot: Record<string, unknown>;
  status: "draft" | "issued" | "expired" | "cancelled";
  expiresAt?: Date;
  createdAt: Date;
  lines: ProformaLineView[];
}

export interface CreateProformaParams {
  partyId: number;
  lines: ProformaLineInput[];
  createdByUserId: number;
}
