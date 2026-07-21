import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savingsApi } from "@/lib/savings.api";
import { queryKeys } from "@/lib/query-keys";

export function useSubscribeSavingsMutation(partyId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => savingsApi.subscribe(partyId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savings(partyId) });
    },
  });
}
