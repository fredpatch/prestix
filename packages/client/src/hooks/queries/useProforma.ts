import { useQuery } from "@tanstack/react-query";
import { proformaApi } from "@/lib/proforma.api";
import { queryKeys } from "@/lib/query-keys";

export function useProforma(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.proforma(id ?? -1),
    queryFn: () => proformaApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });
}
