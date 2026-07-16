// Correction workflow types. A "proposed change" is always a PARTIAL patch —
// only the fields the agent actually wants to change are present; everything
// else on the transaction stays exactly as it was, whether the request is
// approved or still pending.

export interface CommissionEditProposedChanges {
  date?: string;
  commissionAmount?: number;
  clientPartyId?: number | null; // null = "clear this field" (distinct from undefined = "leave as-is")
  referrerPartyId?: number | null;
  details?: Record<string, unknown>;
  note?: string | null;
}

export interface CreateEditRequestParams {
  commissionTransactionId: number;
  requestedBy: number;
  reason: string; // mandatory
  proposedChanges: CommissionEditProposedChanges;
}

export interface CommissionEditRequestView {
  id: number;
  commissionTransactionId: number;
  requestedBy: number;
  reason: string;
  proposedChanges: CommissionEditProposedChanges;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
}

export interface ListEditRequestsFilter {
  status?: "pending" | "approved" | "rejected";
  commissionTransactionId?: number;
}
