import { useQuery } from "@tanstack/react-query";
import { commissionApi } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export function useCommissionEditRequests() {
  return useQuery({
    queryKey: queryKeys.commissionEditRequests(),
    queryFn: () => commissionApi.listEditRequests("pending").then((r) => r.data),
  });
}
