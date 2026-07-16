import { db } from "../../../db/index.js";
import { commissionTransactions, commissionEditRequests, parties } from "../../../db/schema.js";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import { listCommissionTypes } from "../../commission-catalog/services/commission-catalog.service.js";
import type {
  CommissionTransactionView,
  CreateCommissionTransactionParams,
  ListCommissionTransactionsFilter,
} from "./commission.types.js";

function toView(row: typeof commissionTransactions.$inferSelect): CommissionTransactionView {
  return {
    id: row.id,
    type: row.type,
    agentId: row.agentId,
    clientPartyId: row.clientPartyId ?? undefined,
    referrerPartyId: row.referrerPartyId ?? undefined,
    date: row.date,
    commissionAmount: row.commissionAmount,
    details: (row.details as CommissionTransactionView["details"]) ?? undefined,
    note: row.note ?? undefined,
    active: row.active,
    createdAt: row.createdAt,
  };
}

// The one real validation this module does: the type code must exist AND be
// active in the catalog right now. Everything else about a commission is
// manual/free-entry by design (spec: "amount manual always, no auto-calc, no
// formula engine") — this function is deliberately the ONLY gate, not the
// first of many.
async function assertTypeIsActive(typeCode: string): Promise<void> {
  const types = await listCommissionTypes(false); // false = active only
  const match = types.find((t) => t.code === typeCode);
  if (!match) throw new Error("COMMISSION_TYPE_NOT_ACTIVE");
}

// Records one commission transaction. Deliberately NOT wrapped in a
// transaction with anything else — this is a single-table insert, standalone
// by design (M10: "autonomous, never enters Proforma→Facture→BL").
export async function createCommissionTransaction(
  params: CreateCommissionTransactionParams,
): Promise<CommissionTransactionView> {
  if (params.commissionAmount <= 0) throw new Error("COMMISSION_AMOUNT_MUST_BE_POSITIVE");
  await assertTypeIsActive(params.type);

  // Client/référent are optional Party FKs (spec: "absent where N/A, e.g.
  // Mobile Money") — only validate they exist if actually supplied, never
  // require them.
  if (params.clientPartyId) {
    const [client] = await db.select().from(parties).where(eq(parties.id, params.clientPartyId));
    if (!client) throw new Error("CLIENT_PARTY_NOT_FOUND");
  }
  if (params.referrerPartyId) {
    const [referrer] = await db.select().from(parties).where(eq(parties.id, params.referrerPartyId));
    if (!referrer) throw new Error("REFERRER_PARTY_NOT_FOUND");
  }

  const [inserted] = await db
    .insert(commissionTransactions)
    .values({
      type: params.type as typeof commissionTransactions.$inferInsert.type,
      agentId: params.agentId,
      clientPartyId: params.clientPartyId,
      referrerPartyId: params.referrerPartyId,
      date: params.date,
      commissionAmount: params.commissionAmount.toFixed(2),
      details: params.details,
      note: params.note,
    })
    .returning();

  await logAudit({
    userId: params.agentId,
    action: "COMMISSION_TRANSACTION_CREATED",
    entityType: "commission_transactions",
    entityId: String(inserted.id),
    metadata: { type: params.type, amount: params.commissionAmount },
  });

  return toView(inserted);
}

// Simple filtered list — no pagination yet (fine at current volumes; revisit
// if this module gets real load, same caveat as the créances aggregation
// from Sprint 5).
export async function listCommissionTransactions(
  filter: ListCommissionTransactionsFilter = {},
): Promise<CommissionTransactionView[]> {
  const conditions = [];
  if (!filter.includeInactive) conditions.push(eq(commissionTransactions.active, true));
  if (filter.type) conditions.push(eq(commissionTransactions.type, filter.type as typeof commissionTransactions.$inferInsert.type));
  if (filter.agentId) conditions.push(eq(commissionTransactions.agentId, filter.agentId));
  if (filter.dateFrom) conditions.push(gte(commissionTransactions.date, filter.dateFrom));
  if (filter.dateTo) conditions.push(lte(commissionTransactions.date, filter.dateTo));

  const rows =
    conditions.length > 0
      ? await db.select().from(commissionTransactions).where(and(...conditions))
      : await db.select().from(commissionTransactions);

  const views = rows.map(toView);
  if (views.length === 0) return views;

  // One extra query for the whole page rather than N+1 per row — flag which
  // of these transactions currently have an unreviewed correction request,
  // so the list UI can badge them without a separate round trip per row.
  const pendingRequests = await db
    .select()
    .from(commissionEditRequests)
    .where(
      and(
        eq(commissionEditRequests.status, "pending"),
        inArray(
          commissionEditRequests.commissionTransactionId,
          views.map((v) => v.id),
        ),
      ),
    );
  const pendingByTransactionId = new Map(pendingRequests.map((r) => [r.commissionTransactionId, r.id]));

  return views.map((v) => ({ ...v, pendingEditRequestId: pendingByTransactionId.get(v.id) }));
}

// Soft-delete only — per spec ("Deletion: soft-delete; disabling a type in
// use = soft-disable too, M2"). Never a hard delete: commission history feeds
// CA/gain and Employee KPI reporting (M12), so the row must survive even once
// "removed" from the agent's day-to-day view.
export async function softDeleteCommissionTransaction(
  id: number,
  userId: number,
): Promise<CommissionTransactionView> {
  const [existing] = await db.select().from(commissionTransactions).where(eq(commissionTransactions.id, id));
  if (!existing) throw new Error("COMMISSION_TRANSACTION_NOT_FOUND");

  const [updated] = await db
    .update(commissionTransactions)
    .set({ active: false })
    .where(eq(commissionTransactions.id, id))
    .returning();

  await logAudit({
    userId,
    action: "COMMISSION_TRANSACTION_DEACTIVATED",
    entityType: "commission_transactions",
    entityId: String(id),
  });

  return toView(updated);
}
