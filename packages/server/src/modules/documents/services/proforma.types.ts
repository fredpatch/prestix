export interface TicketDetailsInput {
  travelClass: "economy" | "business" | "first" | "premium";
  passengerName: string;
  segments: Array<{
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    flightNo?: string;
    tripType?: "one_way" | "round_trip";
  }>;
  references?: { pnr: string; gds: string; ticketNumber?: string };
  supplierPrice: number;
  sellingPrice: number;
}

export interface ProformaLineInput {
  lineType: "ticket" | "shop";
  description: string;
  quantity?: number;
  unitPrice: number;
  discount?: number;
  ticketDetails?: TicketDetailsInput;
}

export interface TicketDetailsView {
  id: number;
  travelClass: string;
  passengerName: string;
  segments: unknown;
  references?: unknown;
  supplierPrice: string;
  sellingPrice: string;
}

export interface ProformaLineView {
  id: number;
  lineType: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  lineTotal: string;
  ticketDetails?: TicketDetailsView;
}

export interface ProformaView {
  id: number;
  number: string;
  partyId: number;
  referrerPartyId?: number;
  partySnapshot: Record<string, unknown>;
  status: "draft" | "issued" | "expired" | "cancelled";
  expiresAt?: Date;
  createdAt: Date;
  lines: ProformaLineView[];
}

export interface CreateProformaParams {
  partyId: number;
  referrerPartyId?: number;
  lines: ProformaLineInput[];
  createdByUserId: number;
}
