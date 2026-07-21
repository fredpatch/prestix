import { useMutation } from "@tanstack/react-query";
import { partyApi } from "@/lib/party.api";

// Shared by CreatePartyDialog and QuickAddPartyDialog — same endpoint, the
// quick-add form just sends a subset of fields (no cache to invalidate:
// PartiesPage isn't on React Query yet, so both callers still rely on their
// own onCreated prop for refresh, same as before).
export function useCreatePartyMutation() {
  return useMutation({
    mutationFn: (data: Parameters<typeof partyApi.create>[0]) =>
      partyApi.create(data).then((r) => r.data),
  });
}
