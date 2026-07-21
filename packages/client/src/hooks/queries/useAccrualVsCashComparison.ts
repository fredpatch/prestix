import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useAccrualVsCashComparison(params: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.accrualVsCash(params),
    queryFn: () => reportingApi.getAccrualVsCashComparison(params).then((r) => r.data),
  });
}
