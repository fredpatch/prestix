// Central registry of every React Query cache key used in the app.
// Structured as factory functions so components get the same shape every
// time ("parties", { search, roleFilter }) rather than each file inventing
// its own array shape and accidentally creating separate cache entries.
// Pattern: [entity, filters?] — this shape lets queryClient.invalidateQueries
// target an entire entity ("parties") or a specific filter slice.

export const queryKeys = {
  // Parties
  parties: (filters?: { search?: string; roleFilter?: string }) =>
    ["parties", filters ?? {}] as const,
  partyStats: () => ["parties", "stats"] as const,
  party: (id: number) => ["parties", id] as const,
  partyHistory: (id: number) => ["parties", id, "history"] as const,

  // Documents
  proformas: (filters?: object) => ["proformas", filters ?? {}] as const,
  proforma: (id: number) => ["proformas", id] as const,
  invoices: (filters?: object) => ["invoices", filters ?? {}] as const,
  invoice: (id: number) => ["invoices", id] as const,

  // Financial
  creances: (filters?: { onlyOverdue?: boolean; partyId?: number }) =>
    ["creances", filters ?? {}] as const,
  credits: (partyId: number) => ["credits", partyId] as const,
  creditLots: (partyId: number) => ["credits", partyId, "lots"] as const,
  savings: (partyId: number) => ["savings", partyId] as const,
  savingsTransactions: (accountId?: number) => ["savings-transactions", accountId] as const,

  // Operations
  commissions: (filters?: { type?: string }) => ["commissions", filters ?? {}] as const,
  commissionAll: () => ["commission-all"] as const,
  commissionParties: (commissionIds: number[]) => ["commission-parties", commissionIds] as const,
  commissionTypes: () => ["commission-types"] as const,
  commissionEditRequests: (status?: string) =>
    status
      ? (["commission-edit-requests", status] as const)
      : (["commission-edit-requests"] as const),
  stock: (filters?: object) => ["stock", filters ?? {}] as const,
  stockMovements: (articleIds?: number[]) => ["stock-movements", articleIds ?? []] as const,

  // Users
  users: (filters?: { search?: string; roleFilter?: string }) => ["users", filters ?? {}] as const,
  userStats: () => ["users", "stats"] as const,
  user: (id: number) => ["users", id] as const,

  // Reporting
  employeeActivityDetail: (
    agentId: number,
    params: { from: string; to: string; basis: "accrual" | "cash" },
  ) => ["employee-detail", agentId, params.from, params.to, params.basis] as const,
  clientKpis: (params: { from: string; to: string; basis: "accrual" | "cash" }) =>
    ["reporting", "client-kpis", params.from, params.to, params.basis] as const,
  apporteurKpis: (params: { from: string; to: string; basis: "accrual" | "cash" }) =>
    ["reporting", "apporteur-kpis", params.from, params.to, params.basis] as const,
  employeeKpis: (params: { from: string; to: string; basis: "accrual" | "cash" }) =>
    ["reporting", "employee-kpis", params.from, params.to, params.basis] as const,
  dashboardSummary: (params: { from: string; to: string; basis: "accrual" | "cash" }) =>
    ["reporting", "summary", params.from, params.to, params.basis] as const,
  caComposition: (params: { from: string; to: string; basis: "accrual" | "cash" }) =>
    ["reporting", "ca-composition", params.from, params.to, params.basis] as const,
  caTrend: (params: { from: string; to: string; basis: "accrual" | "cash" }) =>
    ["reporting", "ca-trend", params.from, params.to, params.basis] as const,
  serviceTrend: (params: { from: string; to: string; basis: "accrual" | "cash" }) =>
    ["reporting", "service-trend", params.from, params.to, params.basis] as const,
  commissionTypeTrend: (params: { from: string; to: string; basis: "accrual" | "cash" }) =>
    ["reporting", "commission-type-trend", params.from, params.to, params.basis] as const,
  creancesByParty: () => ["reporting", "creances-by-party"] as const,
  accrualVsCash: (params: { from: string; to: string }) =>
    ["reporting", "accrual-vs-cash", params.from, params.to] as const,
  openEngagements: () => ["reporting", "open-engagements"] as const,
  recentActivity: (limit: number) => ["reporting", "recent-activity", limit] as const,
  recentSales: (limit: number) => ["reporting", "recent-sales", limit] as const,

  // Rewards
  rewardSummary: (params: { from: string; to: string }) =>
    ["rewards", "summary", params.from, params.to] as const,
  rewardRows: (
    audience: "clients" | "referrers" | "employees",
    params: { from: string; to: string },
  ) => ["rewards", audience, params.from, params.to] as const,

  // Audit log
  auditLog: (filters?: object) => ["audit-log", filters ?? {}] as const,
  auditLogActions: () => ["audit-log", "actions"] as const,
  auditLogEntityTypes: () => ["audit-log", "entity-types"] as const,

  // Notifications
  notifications: (filters?: object) => ["notifications", filters ?? {}] as const,
  notificationUnreadCount: () => ["notifications", "unread-count"] as const,
  mailOutbox: () => ["notifications", "mail-outbox"] as const,
  mailOutboxList: (filters?: object) => ["notifications", "mail-outbox", "list", filters ?? {}] as const,
  mailOutboxTemplateKeys: () => ["notifications", "mail-outbox", "template-keys"] as const,
} as const;
