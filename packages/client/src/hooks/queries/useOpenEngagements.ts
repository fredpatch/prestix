import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useOpenEngagements() {
  return useQuery({
    queryKey: queryKeys.openEngagements(),
    queryFn: () => reportingApi.getOpenEngagements().then((r) => r.data),
  });
}
