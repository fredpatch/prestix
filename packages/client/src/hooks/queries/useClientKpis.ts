import { useQuery } from "@tanstack/react-query";
import { reportingApi, type DateRangeParams } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useClientKpis(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.clientKpis(params),
    queryFn: () => reportingApi.getClientKpis(params).then((r) => r.data),
  });
}
