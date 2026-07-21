import { useQuery } from "@tanstack/react-query";
import { notificationApi, type NotificationFilters } from "@/lib/notification.api";
import { queryKeys } from "@/lib/query-keys";

export function useNotifications(filters: NotificationFilters) {
  return useQuery({
    queryKey: queryKeys.notifications(filters),
    queryFn: () => notificationApi.list(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
    refetchInterval: 60 * 1000,
  });
}

export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notificationUnreadCount(),
    queryFn: () => notificationApi.unreadCount().then((r) => r.data.count),
    refetchInterval: 60 * 1000,
  });
}
