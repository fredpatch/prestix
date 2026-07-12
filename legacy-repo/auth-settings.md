# Legacy Reference - Auth & Settings (M1, M2)

> Source: `authentication.md`, `settings-architecture.md`, `communication-patterns.md`. Target: monolith + PG.

## Auth - what to KEEP vs DROP

Legacy was **gateway-fronted**: `gateway-service` verified JWTs and forwarded `x-user-id`/`x-org-id` headers; downstream services trusted forwarded headers on `/internal/*` routes.

- **DROP entirely:** gateway, header forwarding, `/internal/*` service-token routes, service-to-service HTTP. In a monolith, the authenticated request context carries the actor directly - no forwarding, no trust-the-header risk.
- **KEEP (business invariants):**
  - `auth` module is the single identity authority.
  - `passwordHash` never leaves auth queries.
  - A strongest-role gate (legacy `SUPER_ADMIN`) guards configuration/settings mutation.
  - Route-level role enforcement (RBAC) - our matrix is in the Phase 1 plan §9.

## Auth gaps to FIX (legacy admitted these)

- **No password-reset workflow** existed → build one (fits our OTP stack).
- Kafka user events + consumers were **stubs** → irrelevant in monolith; drop.
- `orgId` was forwarded but **multi-org was never really implemented** → we intentionally defer multi-agence to V2 (Phase 1 §13), so single-tenant now.

## Settings - KEEP the two-tier idea

Legacy split settings into: **frontend-local** (localStorage: theme, palette) and **backend** (feature flags + business defaults), edits gated by SUPER_ADMIN.

- **KEEP:**
  - Appearance (theme/palette) = client-local, applied immediately, no backend call.
  - Business defaults = server-side (e.g. `defaultCurrency` uppercase 3-letter, `defaultDueDateOffsetDays >= 0`), **prefill forms on mount only** (not on refetch - legacy bug: prefill overwriting in-progress edits).
  - Feature flags toggle module visibility in the sidebar.
  - Catalog seed endpoint is **idempotent**.
- **FIX:** legacy kept **grace/penalty as frontend-only constants** and warned against PATCH overwriting them. In PrestiX, penalty params are **server-side, single source of truth** (see payments-penalties.md).

## PrestiX target (M1, M2)

- `auth` module: users, roles, OTP activation, password reset, audit log. JWT + bcrypt + OTP.
- `settings`/`catalog` module: `global_settings` (business defaults, feature flags) + `service_types`/`catalog_items` registry (drives Commission Divers types, module flags). Seed idempotent.
- RBAC matrix per Phase 1 §9; SUPER_ADMIN-equivalent gate on settings mutation.
