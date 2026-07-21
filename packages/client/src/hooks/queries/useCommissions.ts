import { useQuery } from "@tanstack/react-query";
import { commissionApi } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export function useCommissions(filters: { type?: string }) {
  return useQuery({
    queryKey: queryKeys.commissions(filters),
    queryFn: () => commissionApi.list(filters.type ? { type: filters.type } : {}).then((r) => r.data),
  });
}
