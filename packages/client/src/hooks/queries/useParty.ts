import { useQuery } from "@tanstack/react-query";
import { partyApi } from "@/lib/party.api";
import { queryKeys } from "@/lib/query-keys";

export function useParty(partyId: number) {
  return useQuery({
    queryKey: queryKeys.party(partyId),
    queryFn: () => partyApi.getById(partyId).then((r) => r.data),
  });
}
