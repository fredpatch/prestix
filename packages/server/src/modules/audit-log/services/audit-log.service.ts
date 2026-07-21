import { db } from "../../../db/index.js";
import { auditLog, users } from "../../../db/schema.js";
import { and, desc, eq, gte, lte, inArray } from "drizzle-orm";
import type { AuditLogFilters, AuditLogRow } from "./audit-log.types.js";

// Same fix as reporting.service.ts's endOfDay(): new Date(params.to) parses
// as midnight UTC, silently excluding same-day rows from a `lte` comparison.
// Keeping this local rather than importing from reporting — the two modules
// shouldn't depend on each other for a two-line date helper.
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// Pure display layer over the audit_log table every module already writes
// to via logAudit() — no new tracking. Full, unfiltered log (unlike
// reporting.service.ts's getRecentActivity(), which whitelists to
// transaction-only actions for the dashboard feed).
export async function listAuditLog(
  filters: AuditLogFilters,
): Promise<{ data: AuditLogRow[]; total: number }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (filters.userId !== undefined) conditions.push(eq(auditLog.userId, filters.userId));
  if (filters.action) conditions.push(eq(auditLog.action, filters.action));
  if (filters.entityType) conditions.push(eq(auditLog.entityType, filters.entityType));
  if (filters.entityId) conditions.push(eq(auditLog.entityId, filters.entityId));
  if (filters.from) conditions.push(gte(auditLog.createdAt, new Date(filters.from)));
  if (filters.to) conditions.push(lte(auditLog.createdAt, endOfDay(filters.to)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize)
    .offset(offset);

  const total = await db.$count(auditLog, where);

  const userIds = [...new Set(rows.map((r) => r.userId).filter((id): id is number => id != null))];
  const userRows =
    userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
  const nameById = new Map(userRows.map((u) => [u.id, u.fullName]));

  const data: AuditLogRow[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    actorName: r.userId != null ? nameById.get(r.userId) : undefined,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: (r.metadata as Record<string, unknown>) ?? null,
    createdAt: r.createdAt,
  }));

  return { data, total };
}

// Backs the client's action filter dropdown — distinct values actually
// present in the table, rather than a hardcoded list that drifts as new
// logAudit() call sites get added.
export async function listDistinctActions(): Promise<string[]> {
  const rows = await db.selectDistinct({ action: auditLog.action }).from(auditLog);
  return rows.map((r) => r.action).sort();
}

export async function listDistinctEntityTypes(): Promise<string[]> {
  const rows = await db.selectDistinct({ entityType: auditLog.entityType }).from(auditLog);
  return rows.map((r) => r.entityType).sort();
}
