import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionApi, type CommissionEditProposedChanges } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export function useRequestCommissionEditMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commissionId,
      reason,
      proposedChanges,
    }: {
      commissionId: number;
      reason: string;
      proposedChanges: CommissionEditProposedChanges;
    }) => commissionApi.requestEdit(commissionId, reason, proposedChanges).then((r) => r.data),
    onSuccess: () => {
      // The commission row's pendingEditRequestId badge needs a refresh too,
      // matching CommissionsPage's own handleReload scope.
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions() });
    },
  });
}
