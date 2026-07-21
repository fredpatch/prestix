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
}

export interface BroadcastNotificationInput extends Omit<CreateNotificationInput, "recipientUserId"> {
  minRole?: NotificationRole;
  userIds?: number[];
}
