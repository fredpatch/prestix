import { useQuery } from "@tanstack/react-query";
import { savingsApi } from "@/lib/savings.api";
import { queryKeys } from "@/lib/query-keys";

export function usePartySavingsTransactions(accountId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.savingsTransactions(accountId),
    queryFn: () => savingsApi.listTransactions(accountId!).then((r) => r.data),
    enabled: !!accountId,
  });
}
