# Recurring Patterns

- Service/controller/routes triad per module (auth, users, settings, bootstrap)
- Cookie-based JWT auth:
	- access cookie: prestix_access (short-lived)
	- refresh cookie: prestix_refresh (long-lived)
	- refresh endpoint rotates access token
- RBAC via numeric role levels (agent=1, manager=2, admin=3, super_admin=4)
- Structured auth lifecycle:
	- first login can require OTP validation
	- set-password transitions account out of first-login state
	- failed attempt lockout managed via settings values
- Audit log insertion on sensitive auth/user events
- Startup idempotent settings seed using onConflictDoNothing
