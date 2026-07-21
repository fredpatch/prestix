# PrestiX - Quick Reference

- Client: Lucrece BOUTOMBA, agency Le Prestigieux
- Repo: prestix
- Stack: PostgreSQL + Drizzle, Node/Express, React/Vite/Tailwind, npm workspaces
- Current phase: Sprint 11f UI/reporting polish closed in code; next up is Sprint 11d Notifications
- Ports: API 3000, client dev 5173
- Blockers cleared: EPARGNE_INSCRIPTION_FEE = 5000 XAF, prm = Premium
- API health endpoint: GET /api/health
- Latest pushed commits:
  - `2c64d26` - invoice/proforma document workspace rework
  - `9ecd434` - dashboard report exports aligned with upgraded dashboard
- Reporting exports now include dashboard-aligned graph data:
  - PDF: inline SVG charts for CA/gain, service trend, commission-type trend, plus recent sales.
  - Excel: graph-oriented sheets with numeric data and static text-bar visual columns; no ExcelJS conditional-formatting data bars because Excel repaired/removed those.
- Open: runtime smoke for Sprint 11c/11e/11f UI flows, full reporting/analyse API-runtime smoke, Sprint 9 credit-conversion fee-pair deep check, auto-converted epargne deposit labeling.
