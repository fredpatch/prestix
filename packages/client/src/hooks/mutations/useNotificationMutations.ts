import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/notification.api";
import { queryKeys } from "@/lib/query-keys";

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() });
  };
}

export function useMarkNotificationReadMutation() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsReadMutation() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: invalidate,
  });
}

export function useDismissNotificationMutation() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: notificationApi.dismiss,
    onSuccess: invalidate,
  });
}
