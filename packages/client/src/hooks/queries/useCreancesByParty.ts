import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useCreancesByParty() {
  return useQuery({
    queryKey: queryKeys.creancesByParty(),
    queryFn: () => reportingApi.getCreancesByParty().then((r) => r.data),
  });
}
