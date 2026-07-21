import { useQuery } from "@tanstack/react-query";
import { reportingApi, type DateRangeParams } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

// Shared by GlobalTab and ServicesTab (and, transitively, DashboardPage) —
// same endpoint, same params shape, no reason for two separate hooks.
export function useCaComposition(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.caComposition(params),
    queryFn: () => reportingApi.getCaComposition(params).then((r) => r.data),
  });
}
