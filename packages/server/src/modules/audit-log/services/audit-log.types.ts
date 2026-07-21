export interface AuditLogFilters {
  userId?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string; // ISO date (inclusive, start of day)
  to?: string; // ISO date (inclusive, end of day)
  page?: number;
  pageSize?: number;
}

export interface AuditLogRow {
  id: number;
  userId: number | null;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
