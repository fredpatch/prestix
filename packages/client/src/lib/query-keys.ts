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

  // Operations
  commissions: (filters?: { type?: string }) => ["commissions", filters ?? {}] as const,
  commissionTypes: () => ["commission-types"] as const,
  commissionEditRequests: () => ["commission-edit-requests"] as const,
  stock: (filters?: object) => ["stock", filters ?? {}] as const,

  // Users
  users: (filters?: { search?: string; roleFilter?: string }) =>
    ["users", filters ?? {}] as const,

  // Reporting (no query keys here — dashboard/analyse use local state
  // with date-range params rather than cached entity queries, since every
  // parameter change is a genuinely different dataset, not a refetch of
  // the same list)
} as const;
