import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useRecentActivity(limit = 5) {
  return useQuery({
    queryKey: queryKeys.recentActivity(limit),
    queryFn: () => reportingApi.getRecentActivity(limit).then((r) => r.data),
  });
}
