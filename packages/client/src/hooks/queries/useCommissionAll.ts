import { useQuery } from "@tanstack/react-query";
import { commissionApi } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export function useCommissionAll() {
  return useQuery({
    queryKey: queryKeys.commissionAll(),
    queryFn: () => commissionApi.list({ includeInactive: true }).then((r) => r.data),
  });
}
