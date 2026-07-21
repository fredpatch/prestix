import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useRecentSales(limit = 5) {
  return useQuery({
    queryKey: queryKeys.recentSales(limit),
    queryFn: () => reportingApi.getRecentSales(limit).then((r) => r.data),
  });
}
