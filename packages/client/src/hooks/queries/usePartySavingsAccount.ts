import { useQuery } from "@tanstack/react-query";
import { savingsApi } from "@/lib/savings.api";
import { queryKeys } from "@/lib/query-keys";

export function usePartySavingsAccount(partyId: number) {
  return useQuery({
    queryKey: queryKeys.savings(partyId),
    queryFn: () =>
      savingsApi
        .getAccountByParty(partyId)
        .then((r) => r.data)
        .catch(() => null),
  });
}
