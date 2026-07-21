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

export const notificationApi = {
  list: (filters: NotificationFilters = {}) =>
    api.get<NotificationListResponse>("/notifications", { params: filters }),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: number) => api.patch<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ updated: number }>("/notifications/read-all"),
  dismiss: (id: number) => api.delete<NotificationItem>(`/notifications/${id}`),
  mailStatus: () => api.get<MailConfigStatus>("/notifications/mail/status"),
  sendTestMail: (to: string) => api.post<MailTestResult>("/notifications/mail/test", { to }),
  mailOutbox: (limit = 20) =>
    api.get<MailOutboxItem[]>("/notifications/mail/outbox", { params: { limit } }),
};
