import { useQuery } from "@tanstack/react-query";
import { reportingApi, type DateRangeParams } from "@/lib/reporting.api";
import { queryKeys } from "@/lib/query-keys";

export function useEmployeeKpis(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.employeeKpis(params),
    queryFn: () => reportingApi.getEmployeKpis(params).then((r) => r.data),
  });
}
