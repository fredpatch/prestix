import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { notificationPreferences } from "../../../db/schema.js";
import type {
  NotificationPreferenceView,
  UpdateNotificationPreferenceInput,
} from "./notification.types.js";

function toView(row: typeof notificationPreferences.$inferSelect): NotificationPreferenceView {
  return {
    id: row.id,
    eventCode: row.eventCode,
    label: row.label,
    description: row.description ?? undefined,
    inAppEnabled: row.inAppEnabled,
    emailEnabled: row.emailEnabled,
    updatedAt: row.updatedAt,
  };
}

export async function listNotificationPreferences(): Promise<NotificationPreferenceView[]> {
  const rows = await db.select().from(notificationPreferences).orderBy(notificationPreferences.label);
  return rows.map(toView);
}

export async function updateNotificationPreference(
  eventCode: string,
  input: UpdateNotificationPreferenceInput,
): Promise<NotificationPreferenceView> {
  const [row] = await db
    .update(notificationPreferences)
    .set({
      ...(input.inAppEnabled !== undefined ? { inAppEnabled: input.inAppEnabled } : {}),
      ...(input.emailEnabled !== undefined ? { emailEnabled: input.emailEnabled } : {}),
      updatedAt: new Date(),
    })
    .where(eq(notificationPreferences.eventCode, eventCode))
    .returning();

  if (!row) throw new Error("NOTIFICATION_PREFERENCE_NOT_FOUND");
  return toView(row);
}
