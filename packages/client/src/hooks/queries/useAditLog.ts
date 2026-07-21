import { useQuery } from "@tanstack/react-query";
import { auditLogApi, type AuditLogFilters } from "@/lib/audit-log.api";
import { queryKeys } from "@/lib/query-keys";

export function useAuditLog(filters: AuditLogFilters) {
  return useQuery({
    queryKey: queryKeys.auditLog(filters),
    queryFn: () => auditLogApi.list(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useAuditLogActions() {
  return useQuery({
    queryKey: queryKeys.auditLogActions(),
    queryFn: () => auditLogApi.listActions().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuditLogEntityTypes() {
  return useQuery({
    queryKey: queryKeys.auditLogEntityTypes(),
    queryFn: () => auditLogApi.listEntityTypes().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
