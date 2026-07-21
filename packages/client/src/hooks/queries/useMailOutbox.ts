import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/notification.api";
import { queryKeys } from "@/lib/query-keys";

export function useMailOutbox(enabled = true) {
  return useQuery({
    queryKey: queryKeys.mailOutbox(),
    queryFn: () => notificationApi.mailOutbox(12).then((r) => r.data),
    enabled,
  });
}
