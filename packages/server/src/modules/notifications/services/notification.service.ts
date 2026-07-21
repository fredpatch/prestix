import { db } from "../../../db/index.js";
import { notifications, roleLevel, users } from "../../../db/schema.js";
import { and, desc, eq, ilike, inArray, isNotNull, isNull, or } from "drizzle-orm";
import type {
  BroadcastNotificationInput,
  CreateNotificationInput,
  NotificationFilters,
  NotificationRole,
  NotificationView,
} from "./notification.types.js";

function toView(row: typeof notifications.$inferSelect): NotificationView {
  return {
    id: row.id,
    recipientUserId: row.recipientUserId,
    title: row.title,
    body: row.body,
    category: row.category,
    severity: row.severity,
    sourceType: row.sourceType ?? undefined,
    sourceId: row.sourceId ?? undefined,
    actionUrl: row.actionUrl ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    readAt: row.readAt ?? undefined,
    dismissedAt: row.dismissedAt ?? undefined,
    createdAt: row.createdAt,
  };
}

function normalizePage(value?: number): number {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 1;
}

function normalizePageSize(value?: number): number {
  if (!Number.isFinite(value) || !value || value <= 0) return 25;
  return Math.min(100, Math.floor(value));
}

export async function listNotifications(
  recipientUserId: number,
  filters: NotificationFilters = {},
): Promise<{ data: NotificationView[]; total: number; unread: number }> {
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const offset = (page - 1) * pageSize;

  const conditions = [eq(notifications.recipientUserId, recipientUserId)];

  if (filters.status === "unread") conditions.push(isNull(notifications.readAt));
  if (filters.status === "read") conditions.push(isNotNull(notifications.readAt));
  if (filters.status === "archived") {
    conditions.push(isNotNull(notifications.dismissedAt));
  } else {
    conditions.push(isNull(notifications.dismissedAt));
  }
  if (filters.category) conditions.push(eq(notifications.category, filters.category));
  if (filters.severity) conditions.push(eq(notifications.severity, filters.severity));
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(or(ilike(notifications.title, pattern), ilike(notifications.body, pattern))!);
  }

  const where = and(...conditions);

  const rows = await db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset(offset);

  const total = await db.$count(notifications, where);
  const unread = await db.$count(
    notifications,
    and(
      eq(notifications.recipientUserId, recipientUserId),
      isNull(notifications.dismissedAt),
      isNull(notifications.readAt),
    ),
  );

  return { data: rows.map(toView), total, unread };
}

export async function getUnreadCount(recipientUserId: number): Promise<number> {
  return db.$count(
    notifications,
    and(
      eq(notifications.recipientUserId, recipientUserId),
      isNull(notifications.dismissedAt),
      isNull(notifications.readAt),
    ),
  );
}

export async function createNotification(input: CreateNotificationInput): Promise<NotificationView | null> {
  const values = {
    recipientUserId: input.recipientUserId,
    title: input.title,
    body: input.body,
    category: input.category ?? "system",
    severity: input.severity ?? "info",
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    actionUrl: input.actionUrl,
    dedupeKey: input.dedupeKey,
    metadata: input.metadata,
  };

  const inserted = input.dedupeKey
    ? await db.insert(notifications).values(values).onConflictDoNothing().returning()
    : await db.insert(notifications).values(values).returning();

  return inserted[0] ? toView(inserted[0]) : null;
}

async function listRecipients(minRole?: NotificationRole, explicitUserIds?: number[]): Promise<number[]> {
  if (explicitUserIds && explicitUserIds.length > 0) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.id, [...new Set(explicitUserIds)]), eq(users.active, true)));
    return rows.map((row) => row.id);
  }

  const rows = await db.select().from(users).where(eq(users.active, true));
  const minLevel = minRole ? roleLevel[minRole] : roleLevel.agent;
  return rows.filter((user) => roleLevel[user.role] >= minLevel).map((user) => user.id);
}

export async function broadcastNotification(
  input: BroadcastNotificationInput,
): Promise<NotificationView[]> {
  const recipientIds = await listRecipients(input.minRole, input.userIds);
  const created: NotificationView[] = [];

  for (const recipientUserId of recipientIds) {
    const row = await createNotification({
      ...input,
      recipientUserId,
      dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${recipientUserId}` : undefined,
    });
    if (row) created.push(row);
  }

  return created;
}

export async function markAsRead(id: number, recipientUserId: number): Promise<NotificationView> {
  const [row] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.recipientUserId, recipientUserId)))
    .returning();

  if (!row) throw new Error("NOTIFICATION_NOT_FOUND");
  return toView(row);
}

export async function markAllAsRead(recipientUserId: number): Promise<number> {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.recipientUserId, recipientUserId),
        isNull(notifications.dismissedAt),
        isNull(notifications.readAt),
      ),
    )
    .returning();

  return rows.length;
}

export async function dismissNotification(id: number, recipientUserId: number): Promise<NotificationView> {
  const now = new Date();
  const [row] = await db
    .update(notifications)
    .set({ dismissedAt: now, readAt: now })
    .where(and(eq(notifications.id, id), eq(notifications.recipientUserId, recipientUserId)))
    .returning();

  if (!row) throw new Error("NOTIFICATION_NOT_FOUND");
  return toView(row);
}
