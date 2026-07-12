// Single source of truth for shared entities/enums/DTOs (server + client).
// Full domain model lands with the Drizzle schema task (Sprint 0, item 4).

export enum Role {
  Agent = 1,
  Manager = 2,
  Admin = 3,
  SuperAdmin = 4,
}
