import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partyApi } from "@/lib/party.api";
import { queryKeys } from "@/lib/query-keys";

export function useTogglePartyActivationMutation(partyId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) => partyApi.toggleActivation(partyId, active).then((r) => r.data),
    onSuccess: () => {
      // Matches the original handleReload's invalidation scope exactly —
      // toggling activation is the one action here that can plausibly
      // affect every tab on the page.
      queryClient.invalidateQueries({ queryKey: queryKeys.party(partyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.credits(partyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditLots(partyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.partyHistory(partyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.creances({ partyId }) });
      queryClient.invalidateQueries({ queryKey: queryKeys.savings(partyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTransactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.parties() });
      queryClient.invalidateQueries({ queryKey: queryKeys.partyStats() });
    },
  });
}
