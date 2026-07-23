import api from "./axios";

export interface NotificationPreference {
  id: number;
  eventCode: string;
  label: string;
  description?: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  updatedAt: string;
}

export const notificationPreferencesApi = {
  list: () => api.get<NotificationPreference[]>("/notifications/preferences"),
  update: (eventCode: string, changes: { inAppEnabled?: boolean; emailEnabled?: boolean }) =>
    api.patch<NotificationPreference>(`/notifications/preferences/${eventCode}`, changes),
};
