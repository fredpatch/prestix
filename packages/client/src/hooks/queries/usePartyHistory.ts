import { useQuery } from "@tanstack/react-query";
import { partyApi } from "@/lib/party.api";
import { queryKeys } from "@/lib/query-keys";

export function usePartyHistory(partyId: number) {
  return useQuery({
    queryKey: queryKeys.partyHistory(partyId),
    queryFn: () => partyApi.getHistory(partyId).then((r) => r.data),
  });
}
