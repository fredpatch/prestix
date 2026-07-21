import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partyApi } from "@/lib/party.api";
import { queryKeys } from "@/lib/query-keys";

export function useUpdatePartyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof partyApi.update>[1] }) =>
      partyApi.update(id, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.party(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.parties() });
      queryClient.invalidateQueries({ queryKey: queryKeys.partyStats() });
    },
  });
}
