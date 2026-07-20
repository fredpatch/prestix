import { useQuery } from "@tanstack/react-query";
import { creanceApi } from "@/lib/creance.api";
import { queryKeys } from "@/lib/query-keys";

export function useCreances(filters: { onlyOverdue?: boolean }) {
  return useQuery({
    queryKey: queryKeys.creances(filters),
    queryFn: () => creanceApi.list(filters.onlyOverdue).then((r) => r.data),
  });
}
