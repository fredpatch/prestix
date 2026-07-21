import { useQuery } from "@tanstack/react-query";
import { partyApi } from "@/lib/party.api";
import { queryKeys } from "@/lib/query-keys";

export function useParties(filters: { search?: string; roleFilter?: "" | "client" | "referrer" }) {
  return useQuery({
    queryKey: queryKeys.parties(filters),
    queryFn: () =>
      partyApi
        .list({
          search: filters.search || undefined,
          isClient: filters.roleFilter === "client" ? true : undefined,
          isReferrer: filters.roleFilter === "referrer" ? true : undefined,
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}
