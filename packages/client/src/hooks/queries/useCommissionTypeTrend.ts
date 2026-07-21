import { useQuery } from "@tanstack/react-query";
import { reportingApi, type DateRangeParams } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useCommissionTypeTrend(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.commissionTypeTrend(params),
    queryFn: () => reportingApi.getCommissionTypeTrend(params).then((r) => r.data),
  });
}
