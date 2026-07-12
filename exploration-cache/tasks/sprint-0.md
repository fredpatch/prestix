# Sprint 0 — Initialization ✅ CLOSED (2026-07-12)

- [x] Kick-off with Lucrèce (EPARGNE_INSCRIPTION_FEE=5000 XAF, prm=Premium resolved)
- [x] Monorepo scaffold
- [x] Deployment infra (docker-compose dev/staging/prod, nginx, Dockerfiles, deploy scripts)
- [x] Docker env — validated end-to-end (postgres+api+client up, migrations auto-apply on boot)
- [x] Full Drizzle schema — audited vs M1-M11 feasibility spec, 3 gaps fixed
- [x] Pre-flight: Puppeteer PDF render — Alpine/Chromium fixed, legacy template ported
- [x] Pre-flight: Mongo→PG migration spike — schema-mapping complete, see technical/mongo-pg-migration-mapping.md
- [x] Seed: super_admin superseded by bootstrap flow
- [x] Seed: catalog/flags/counters/settings — verified vs spec, auto-runs on boot

## Already implemented ahead of sprint closure

- Bootstrap endpoints, Auth endpoints (cookie JWT + refresh), Users admin routes, Settings admin/super_admin routes
