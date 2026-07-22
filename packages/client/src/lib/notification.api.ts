import api from "./axios";

export type NotificationCategory =
  | "system"
  | "documents"
  | "finance"
  | "stock"
  | "commission"
  | "savings";

export type NotificationSeverity = "info" | "success" | "warning" | "danger";
export type NotificationStatusFilter = "all" | "unread" | "read" | "archived";

export interface NotificationItem {
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
  readAt?: string;
  dismissedAt?: string;
  createdAt: string;
}

export interface NotificationFilters {
  status?: NotificationStatusFilter;
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  total: number;
  unread: number;
}

export interface MailConfigStatus {
  enabled: boolean;
  configured: boolean;
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  from?: string;
  transportOk: boolean;
  message?: string;
}

export interface MailTestResult {
  success: boolean;
  outbox: {
    id: number;
    status: "pending" | "sent" | "failed";
    errorMessage?: string;
  };
  messageId?: string;
  accepted: string[];
  rejected: string[];
  errorMessage?: string;
}

export interface MailOutboxItem {
  id: number;
  notificationId?: number;
  recipient: string;
  subject: string;
  templateKey: string;
  status: "pending" | "sent" | "failed";
  sourceType?: string;
  sourceId?: string;
  messageId?: string;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MailOutboxFilters {
  status?: "pending" | "sent" | "failed";
  templateKey?: string;
  sourceType?: string;
  recipient?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface MailOutboxListResponse {
  data: MailOutboxItem[];
  total: number;
}

// Same shape as invoice.api.ts's DocumentEmailResult — retry re-dispatches
// into the same sendTrackedMail path, so the result shape is identical.
export interface MailOutboxRetryResult {
  success: boolean;
  outbox: MailOutboxItem;
  accepted: string[];
  rejected: string[];
  messageId?: string;
  errorMessage?: string;
}

export const notificationApi = {
  list: (filters: NotificationFilters = {}) =>
    api.get<NotificationListResponse>("/notifications", { params: filters }),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: number) => api.patch<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ updated: number }>("/notifications/read-all"),
  dismiss: (id: number) => api.delete<NotificationItem>(`/notifications/${id}`),
  mailStatus: () => api.get<MailConfigStatus>("/notifications/mail/status"),
  sendTestMail: (to: string) => api.post<MailTestResult>("/notifications/mail/test", { to }),
  mailOutbox: (filters: MailOutboxFilters = {}) =>
    api.get<MailOutboxListResponse>("/notifications/mail/outbox", { params: filters }),
  mailOutboxDetail: (id: number) =>
    api.get<MailOutboxItem>(`/notifications/mail/outbox/${id}`),
  mailOutboxTemplateKeys: () =>
    api.get<string[]>("/notifications/mail/outbox/template-keys"),
  mailOutboxRetry: (id: number) =>
    api.post<MailOutboxRetryResult>(`/notifications/mail/outbox/${id}/retry`, {}, { timeout: 60_000 }),
};
