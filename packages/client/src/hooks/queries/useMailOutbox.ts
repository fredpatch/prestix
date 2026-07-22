import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/notification.api";
import { queryKeys } from "@/lib/query-keys";

// Lightweight preview used by the dashboard widget (top N, no filters).
// The full filterable/paginated view lives in MailOutboxPage.tsx via
// useMailOutboxList below.
export function useMailOutbox(enabled = true) {
  return useQuery({
    queryKey: queryKeys.mailOutbox(),
    queryFn: () => notificationApi.mailOutbox({ pageSize: 12 }).then((r) => r.data.data),
    enabled,
  });
}
