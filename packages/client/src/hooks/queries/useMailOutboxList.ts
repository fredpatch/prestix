import { useQuery } from "@tanstack/react-query";
import { type MailOutboxFilters, notificationApi } from "@/lib/notification.api";
import { queryKeys } from "@/lib/query-keys";

export function useMailOutboxList(filters: MailOutboxFilters) {
  return useQuery({
    queryKey: queryKeys.mailOutboxList(filters),
    queryFn: () => notificationApi.mailOutbox(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useMailOutboxTemplateKeys() {
  return useQuery({
    queryKey: queryKeys.mailOutboxTemplateKeys(),
    queryFn: () => notificationApi.mailOutboxTemplateKeys().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
