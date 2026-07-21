import { useQuery } from "@tanstack/react-query";
import { creditApi } from "@/lib/credit.api";
import { queryKeys } from "@/lib/query-keys";

export function usePartyCreditBalance(partyId: number) {
  return useQuery({
    queryKey: queryKeys.credits(partyId),
    queryFn: () => creditApi.getBalance(partyId).then((r) => r.data),
  });
}
