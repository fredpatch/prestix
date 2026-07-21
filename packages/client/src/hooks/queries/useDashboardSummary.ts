import { useQuery } from "@tanstack/react-query";
import { reportingApi, type DateRangeParams } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardSummary(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(params),
    queryFn: () => reportingApi.getSummary(params).then((r) => r.data),
  });
}
