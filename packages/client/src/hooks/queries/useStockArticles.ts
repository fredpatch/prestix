import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock.api";
import { queryKeys } from "@/lib/query-keys";

export function useStockArticles(includeInactive: boolean) {
  return useQuery({
    queryKey: queryKeys.stock({ includeInactive }),
    queryFn: () => stockApi.list(includeInactive).then((r) => r.data),
  });
}
