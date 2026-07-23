import { db } from "../../../db/index.js";
import { notificationPreferences, notifications, roleLevel, users } from "../../../db/schema.js";
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

// Pass 6 gating. No row for a given eventCode (not yet seeded, or the
// caller passed a code outside NOTIFICATION_EVENT_CODES) defaults to
// "in-app on, email off" — today's behavior — rather than silently
// dropping a notification because the catalog is momentarily out of sync
// with the code.
async function getPreference(
  eventCode?: string,
): Promise<{ inAppEnabled: boolean; emailEnabled: boolean }> {
  if (!eventCode) return { inAppEnabled: true, emailEnabled: false };
  const [row] = await db
    .select({ inAppEnabled: notificationPreferences.inAppEnabled, emailEnabled: notificationPreferences.emailEnabled })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.eventCode, eventCode))
    .limit(1);
  return row ?? { inAppEnabled: true, emailEnabled: false };
}

// Fire-and-forget, best-effort — mirrors the non-blocking pattern used
// everywhere else mail is queued off the back of another action. A failed
// preference-driven email never blocks or rolls back notification creation.
// Dynamic import avoids a circular dependency risk with the documents module.
async function queuePreferenceEmail(input: CreateNotificationInput): Promise<void> {
  try {
    const [recipient] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, input.recipientUserId))
      .limit(1);
    if (!recipient?.email) return;

    const { sendTrackedMail } = await import("./mail-outbox.service.js");
    const { emailShell, emailIconAttachments, escapeHtml } = await import(
      "../../documents/services/email-shell.js"
    );

    const html = emailShell({
      tone: "amber",
      heroIcon: "hero-bell-ringing",
      bannerHeadline: escapeHtml(input.title),
      bodyGreetingName: "équipe",
      bodyIntro: escapeHtml(input.body),
      rows: [],
      closingHtml: "Notification automatique — PrestiX.",
    });

    await sendTrackedMail({
      to: recipient.email,
      subject: `PrestiX - ${input.title}`,
      text: input.body,
      html,
      attachments: emailIconAttachments(),
      templateKey: `notification_${input.eventCode ?? "generic"}`,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      metadata: { eventCode: input.eventCode, recipientUserId: input.recipientUserId },
    });
  } catch (error) {
    console.warn("[notifications:preference-email]", error);
  }
}

export async function createNotification(input: CreateNotificationInput): Promise<NotificationView | null> {
  const preference = await getPreference(input.eventCode);
  if (!preference.inAppEnabled) return null;

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

  const row = inserted[0] ? toView(inserted[0]) : null;

  // Only email on an actual new row — onConflictDoNothing() returning
  // empty means this was a dedupe hit, and we must not re-email for an
  // event that already fired.
  if (row && preference.emailEnabled) void queuePreferenceEmail(input);

  return row;
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
