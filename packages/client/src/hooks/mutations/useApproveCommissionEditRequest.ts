import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionApi } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export function useApproveCommissionEditRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => commissionApi.approveEditRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissionEditRequests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions() });
    },
  });
}
