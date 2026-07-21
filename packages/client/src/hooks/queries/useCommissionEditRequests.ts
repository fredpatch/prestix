import { useQuery } from "@tanstack/react-query";
import { commissionApi } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export type CommissionEditRequestStatusFilter = "all" | "pending" | "approved" | "rejected";

export function useCommissionEditRequests(status: CommissionEditRequestStatusFilter = "pending") {
  return useQuery({
    queryKey: queryKeys.commissionEditRequests(status),
    queryFn: () =>
      status === "all"
        ? commissionApi.listAllEditRequests().then((r) => r.data)
        : commissionApi.listEditRequests(status).then((r) => r.data),
  });
}
