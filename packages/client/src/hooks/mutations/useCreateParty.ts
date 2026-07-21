import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partyApi } from "@/lib/party.api";
import { queryKeys } from "@/lib/query-keys";

// Shared by CreatePartyDialog and QuickAddPartyDialog — same endpoint, the
// quick-add form just sends a subset of fields. Callers can still use their
// own onCreated prop for local follow-up, but shared party caches are
// invalidated here.
export function useCreatePartyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof partyApi.create>[0]) =>
      partyApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties() });
      queryClient.invalidateQueries({ queryKey: queryKeys.partyStats() });
    },
  });
}
