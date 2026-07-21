import { useQuery } from "@tanstack/react-query";
import { partyApi, type Party } from "@/lib/party.api";
import { queryKeys } from "@/lib/query-keys";

// Keyed off the commission IDs so it refetches when the commission list
// changes. Only fetches party IDs actually referenced by the given
// commissions, not the whole parties table.
export function useCommissionParties(
  commissions: { id: number; clientPartyId?: number | null; referrerPartyId?: number | null }[],
) {
  return useQuery<Record<number, Party>>({
    queryKey: queryKeys.commissionParties(commissions.map((c) => c.id)),
    queryFn: async () => {
      const partyIds = [
        ...new Set(
          commissions.flatMap((c) => [c.clientPartyId, c.referrerPartyId]).filter((id): id is number => !!id),
        ),
      ];
      if (partyIds.length === 0) return {};
      const results = await Promise.all(partyIds.map((id) => partyApi.getById(id)));
      return Object.fromEntries(results.map((r) => [r.data.id, r.data]));
    },
    enabled: commissions.length > 0,
  });
}
