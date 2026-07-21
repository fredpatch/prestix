import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionApi } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export function useRejectCommissionEditRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, note }: { requestId: number; note?: string }) =>
      commissionApi.rejectEditRequest(requestId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissionEditRequests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions() });
    },
  });
}
