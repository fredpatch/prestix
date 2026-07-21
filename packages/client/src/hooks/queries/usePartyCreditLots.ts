import { useQuery } from "@tanstack/react-query";
import { creditApi } from "@/lib/credit.api";
import { queryKeys } from "@/lib/query-keys";

export function usePartyCreditLots(partyId: number) {
  return useQuery({
    queryKey: queryKeys.creditLots(partyId),
    queryFn: () => creditApi.listLots(partyId).then((r) => r.data),
  });
}
