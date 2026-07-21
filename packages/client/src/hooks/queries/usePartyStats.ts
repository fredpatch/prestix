import { useQuery } from "@tanstack/react-query";
import { partyApi } from "@/lib/party.api";
import { queryKeys } from "@/lib/query-keys";

export function usePartyStats() {
  return useQuery({
    queryKey: queryKeys.partyStats(),
    queryFn: () => partyApi.stats().then((r) => r.data),
  });
}
