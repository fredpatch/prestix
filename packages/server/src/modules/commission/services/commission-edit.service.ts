import { db } from "../../../db/index.js";
import { commissionEditRequests, commissionTransactions } from "../../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import { broadcastNotification, createNotification } from "../../notifications/services/notification.service.js";
import type {
  CommissionEditRequestView,
  CreateEditRequestParams,
  ListEditRequestsFilter,
} from "./commission-edit.types.js";

function toView(row: typeof commissionEditRequests.$inferSelect): CommissionEditRequestView {
  return {
    id: row.id,
    commissionTransactionId: row.commissionTransactionId,
    requestedBy: row.requestedBy,
    reason: row.reason,
    proposedChanges: row.proposedChanges as CommissionEditRequestView["proposedChanges"],
    status: row.status,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: row.reviewedAt ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    createdAt: row.createdAt,
  };
}

// An agent submits proposed changes + a reason. Nothing on the actual
// commission changes yet — that only happens on approval, below. Only one
// pending request per transaction at a time: prevents two conflicting edits
// (from the same agent or different ones) from queuing up before either gets
// reviewed, which would make "approve" ambiguous about which change wins.
export async function createEditRequest(
  params: CreateEditRequestParams,
): Promise<CommissionEditRequestView> {
  if (!params.reason?.trim()) throw new Error("EDIT_REASON_REQUIRED");

  const [transaction] = await db
    .select()
    .from(commissionTransactions)
    .where(eq(commissionTransactions.id, params.commissionTransactionId));
  if (!transaction) throw new Error("COMMISSION_TRANSACTION_NOT_FOUND");

  const [existingPending] = await db
    .select()
    .from(commissionEditRequests)
    .where(
      and(
        eq(commissionEditRequests.commissionTransactionId, params.commissionTransactionId),
        eq(commissionEditRequests.status, "pending"),
      ),
    );
  if (existingPending) throw new Error("EDIT_REQUEST_ALREADY_PENDING");

  // Same positivity rule as creation itself — a proposed amount change can't
  // sneak a zero/negative value past review just because it's a "request"
  // rather than a direct write.
  if (
    params.proposedChanges.commissionAmount !== undefined &&
    params.proposedChanges.commissionAmount <= 0
  ) {
    throw new Error("COMMISSION_AMOUNT_MUST_BE_POSITIVE");
  }

  const [inserted] = await db
    .insert(commissionEditRequests)
    .values({
      commissionTransactionId: params.commissionTransactionId,
      requestedBy: params.requestedBy,
      reason: params.reason,
      proposedChanges: params.proposedChanges,
    })
    .returning();

  await logAudit({
    userId: params.requestedBy,
    action: "COMMISSION_EDIT_REQUESTED",
    entityType: "commission_edit_requests",
    entityId: String(inserted.id),
    metadata: { commissionTransactionId: params.commissionTransactionId, reason: params.reason },
  });

  await broadcastNotification({
    minRole: "admin",
    title: `Demande de modification #${inserted.id}`,
    body: "Une correction de commission attend une décision administrateur.",
    category: "commission",
    severity: "warning",
    sourceType: "commission_edit_requests",
    sourceId: String(inserted.id),
    actionUrl: "/commissions/edit-requests",
    dedupeKey: `commission-edit-requested:${inserted.id}`,
    metadata: {
      commissionTransactionId: params.commissionTransactionId,
      requestedBy: params.requestedBy,
    },
  });

  return toView(inserted);
}

export async function listEditRequests(
  filter: ListEditRequestsFilter = {},
): Promise<CommissionEditRequestView[]> {
  const conditions = [];
  if (filter.status) conditions.push(eq(commissionEditRequests.status, filter.status));
  if (filter.commissionTransactionId)
    conditions.push(eq(commissionEditRequests.commissionTransactionId, filter.commissionTransactionId));

  const rows =
    conditions.length > 0
      ? await db.select().from(commissionEditRequests).where(and(...conditions))
      : await db.select().from(commissionEditRequests);

  return rows.map(toView);
}

// THE mutation point — this is the only place in the whole module where a
// commission transaction's fields change after creation. Applies exactly the
// subset of fields the agent proposed (partial patch), nothing more, inside
// one transaction alongside marking the request approved — either both
// happen or neither does.
export async function approveEditRequest(
  requestId: number,
  reviewerId: number,
): Promise<CommissionEditRequestView> {
  const [request] = await db.select().from(commissionEditRequests).where(eq(commissionEditRequests.id, requestId));
  if (!request) throw new Error("EDIT_REQUEST_NOT_FOUND");
  if (request.status !== "pending") throw new Error("EDIT_REQUEST_NOT_PENDING");

  const changes = request.proposedChanges as Record<string, unknown>;
  const updates: Partial<typeof commissionTransactions.$inferInsert> = {};
  if (changes.date !== undefined) updates.date = changes.date as string;
  if (changes.commissionAmount !== undefined)
    updates.commissionAmount = (changes.commissionAmount as number).toFixed(2);
  if (changes.clientPartyId !== undefined) updates.clientPartyId = changes.clientPartyId as number | null;
  if (changes.referrerPartyId !== undefined)
    updates.referrerPartyId = changes.referrerPartyId as number | null;
  if (changes.details !== undefined) updates.details = changes.details;
  if (changes.note !== undefined) updates.note = changes.note as string | null;

  await db.transaction(async (tx: any) => {
    await tx
      .update(commissionTransactions)
      .set(updates)
      .where(eq(commissionTransactions.id, request.commissionTransactionId));
    await tx
      .update(commissionEditRequests)
      .set({ status: "approved", reviewedBy: reviewerId, reviewedAt: new Date() })
      .where(eq(commissionEditRequests.id, requestId));
  });

  await logAudit({
    userId: reviewerId,
    action: "COMMISSION_EDIT_APPROVED",
    entityType: "commission_edit_requests",
    entityId: String(requestId),
    metadata: { commissionTransactionId: request.commissionTransactionId, changes },
  });

  const [updated] = await db.select().from(commissionEditRequests).where(eq(commissionEditRequests.id, requestId));
  await createNotification({
    recipientUserId: updated.requestedBy,
    title: `Demande #${updated.id} approuvée`,
    body: "Votre demande de modification de commission a été approuvée.",
    category: "commission",
    severity: "success",
    sourceType: "commission_edit_requests",
    sourceId: String(updated.id),
    actionUrl: "/commissions/edit-requests",
    dedupeKey: `commission-edit-approved:${updated.id}`,
    metadata: { commissionTransactionId: updated.commissionTransactionId, reviewedBy: reviewerId },
  });
  return toView(updated);
}

// Rejecting touches ONLY the request row — the commission transaction is
// never modified, exactly as if the request had never been submitted, aside
// from the audit trail (which is the point: a rejected request with its
// reason is itself useful history, even though nothing on the commission
// actually changed).
export async function rejectEditRequest(
  requestId: number,
  reviewerId: number,
  reviewNote?: string,
): Promise<CommissionEditRequestView> {
  const [request] = await db.select().from(commissionEditRequests).where(eq(commissionEditRequests.id, requestId));
  if (!request) throw new Error("EDIT_REQUEST_NOT_FOUND");
  if (request.status !== "pending") throw new Error("EDIT_REQUEST_NOT_PENDING");

  const [updated] = await db
    .update(commissionEditRequests)
    .set({ status: "rejected", reviewedBy: reviewerId, reviewedAt: new Date(), reviewNote })
    .where(eq(commissionEditRequests.id, requestId))
    .returning();

  await logAudit({
    userId: reviewerId,
    action: "COMMISSION_EDIT_REJECTED",
    entityType: "commission_edit_requests",
    entityId: String(requestId),
    metadata: { commissionTransactionId: request.commissionTransactionId, reviewNote },
  });

  await createNotification({
    recipientUserId: updated.requestedBy,
    title: `Demande #${updated.id} refusée`,
    body: reviewNote
      ? `Votre demande de modification de commission a été refusée : ${reviewNote}`
      : "Votre demande de modification de commission a été refusée.",
    category: "commission",
    severity: "danger",
    sourceType: "commission_edit_requests",
    sourceId: String(updated.id),
    actionUrl: "/commissions/edit-requests",
    dedupeKey: `commission-edit-rejected:${updated.id}`,
    metadata: { commissionTransactionId: updated.commissionTransactionId, reviewedBy: reviewerId },
  });

  return toView(updated);
}
