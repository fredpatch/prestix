import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useEmployeeActivityDetail(
  agentId: number | undefined,
  params: { from: string; to: string; basis: "accrual" | "cash" },
) {
  return useQuery({
    queryKey: queryKeys.employeeActivityDetail(agentId ?? -1, params),
    queryFn: () => reportingApi.getEmployeeActivityDetail(agentId!, params).then((r) => r.data),
    enabled: !!agentId,
  });
}
