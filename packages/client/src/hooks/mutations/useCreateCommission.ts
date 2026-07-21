import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionApi, type CreateCommissionInput } from "@/lib/commission.api";
import { queryKeys } from "@/lib/query-keys";

export function useCreateCommissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommissionInput) => commissionApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions() });
    },
  });
}
