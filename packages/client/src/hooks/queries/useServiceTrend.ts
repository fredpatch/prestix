import { useQuery } from "@tanstack/react-query";
import { reportingApi, type DateRangeParams } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useServiceTrend(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.serviceTrend(params),
    queryFn: () => reportingApi.getServiceTrend(params).then((r) => r.data),
  });
}
