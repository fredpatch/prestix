# Database Schema

Full Drizzle schema is committed in packages/server/src/db/schema.ts.

Current status:
- Enums and core tables are defined across M1-M12 domains.
- Startup default settings seed exists in start/services/parameters-seed.service.ts.
- Remaining work is validation and runtime verification (migrations + smoke tests), not initial schema authoring.
