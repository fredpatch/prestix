import { useQuery } from "@tanstack/react-query";
import { reportingApi, type DateRangeParams } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useApporteurKpis(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.apporteurKpis(params),
    queryFn: () => reportingApi.getApporteurKpis(params).then((r) => r.data),
  });
}
