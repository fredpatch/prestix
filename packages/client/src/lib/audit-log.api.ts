import api from "./axios";

export interface AuditLogRow {
  id: number;
  userId: number | null;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const auditLogApi = {
  list: (filters: AuditLogFilters = {}) =>
    api.get<{ data: AuditLogRow[]; total: number }>("/audit-log", { params: filters }),
  listActions: () => api.get<string[]>("/audit-log/actions"),
  listEntityTypes: () => api.get<string[]>("/audit-log/entity-types"),
};
