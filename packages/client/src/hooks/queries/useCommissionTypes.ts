import { useQuery } from "@tanstack/react-query";
import { commissionCatalogApi } from "@/lib/commission-catalog.api";
import { queryKeys } from "@/lib/query-keys";

export function useCommissionTypes() {
  return useQuery({
    queryKey: queryKeys.commissionTypes(),
    queryFn: () => commissionCatalogApi.list().then((r) => r.data),
  });
}
