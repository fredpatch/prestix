import { useQuery } from "@tanstack/react-query";
import { proformaApi } from "@/lib/proforma.api";
import { queryKeys } from "@/lib/query-keys";

export function useProformas(partyId?: number) {
  return useQuery({
    queryKey: queryKeys.proformas(partyId ? { partyId } : undefined),
    queryFn: () => proformaApi.list(partyId).then((r) => r.data),
  });
}
