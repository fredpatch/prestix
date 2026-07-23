import type {
  notificationCategoryEnum,
  notificationSeverityEnum,
  roleEnum,
} from "../../../db/schema.js";

export type NotificationCategory = (typeof notificationCategoryEnum.enumValues)[number];
export type NotificationSeverity = (typeof notificationSeverityEnum.enumValues)[number];
export type NotificationRole = (typeof roleEnum.enumValues)[number];

export interface NotificationView {
  id: number;
  recipientUserId: number;
  title: string;
  body: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  sourceType?: string;
  sourceId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  dismissedAt?: Date;
  createdAt: Date;
}

export interface NotificationFilters {
  status?: "all" | "unread" | "read" | "archived";
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateNotificationInput {
  recipientUserId: number;
  title: string;
  body: string;
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  sourceType?: string;
  sourceId?: string;
  actionUrl?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
  // Pass 6 — stable event code used to look up notification_preferences.
  // Optional for backward compatibility (a caller that omits it always
  // creates the in-app row and never emails, i.e. today's behavior), but
  // every real producer in the codebase should set it going forward so
  // preferences actually apply. See NOTIFICATION_EVENT_CODES for the
  // known set, derived from each producer's existing dedupeKey prefix.
  eventCode?: string;
}

export interface BroadcastNotificationInput extends Omit<CreateNotificationInput, "recipientUserId"> {
  minRole?: NotificationRole;
  userIds?: number[];
}

// The 8 known event codes, taken verbatim from each producer's existing
// dedupeKey prefix (jobs/index.ts, commission-edit.service.ts) — not a new
// taxonomy, just making the existing convention configurable. Adding a 9th
// producer later means adding its code here AND seeding a preference row
// for it (see notification-preferences-seed.service.ts).
export const NOTIFICATION_EVENT_CODES = [
  "installment-due-soon",
  "proforma-expired",
  "penalties-accrued",
  "credit-auto-converted",
  "credit-held-review",
  "commission-edit-requested",
  "commission-edit-approved",
  "commission-edit-rejected",
] as const;

export type NotificationEventCode = (typeof NOTIFICATION_EVENT_CODES)[number];

export interface NotificationPreferenceView {
  id: number;
  eventCode: string;
  label: string;
  description?: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  updatedAt: Date;
}

export interface UpdateNotificationPreferenceInput {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
}
