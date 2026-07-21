import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionApi } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export function useDeleteCommissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => commissionApi.softDelete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions() });
    },
    // Previously this call had no catch at all (unhandled rejection on
    // failure) — now falls through to the global error toast.
  });
}
