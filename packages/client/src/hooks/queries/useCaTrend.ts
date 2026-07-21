import { useQuery } from "@tanstack/react-query";
import { reportingApi, type DateRangeParams } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useCaTrend(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.caTrend(params),
    queryFn: () => reportingApi.getCaTrend(params).then((r) => r.data),
  });
}
