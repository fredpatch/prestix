# PrestiX - Quick Reference

- Client: Lucrece BOUTOMBA, agency Le Prestigieux
- Repo: prestix
- Stack: PostgreSQL + Drizzle, Node/Express, React/Vite/Tailwind, npm workspaces
- Current phase: Settings theme selector landed; Sprint 12 runtime smoke pending
- Ports: API 3000, client dev 5173
- Blockers cleared: EPARGNE_INSCRIPTION_FEE = 5000 XAF, prm = Premium
- API health endpoint: GET /api/health
- Latest pushed commits:
  - `2c64d26` - invoice/proforma document workspace rework
  - `9ecd434` - dashboard report exports aligned with upgraded dashboard
  - `9cd6342` - notifications and mail foundation
  - `a57eb19` - document email delivery
  - `77cc7c5` - Aide/company-party docs sync
  - `c3b3430` - latest dark-mode semantic-token polish batch
  - `2acb419` - Settings theme selector/Login polish batch
- Aide/help:
  - `/aide` route contains static Markdown module guides bundled with Vite `?raw`.
  - Contextual page help uses `PageHeaderProvider.helpTopic`, `GuideTrigger`, and `HelpPanel`.
- Company parties:
  - Migration `20260723070400_sleepy_madame_web` adds `party_type`, `trade_name`, and `tax_id`.
  - `partyType = company` requires `tradeName`; switching back to individual clears company-only fields.
  - Document PDFs resolve company buyer labels to trade name and print RCCM/NIF when available.
- Dark mode/UI tokens:
  - `styles/index.css` now defines brand-gold primary/ring/sidebar tokens,
    tinted dark surfaces, text tiers, and semantic status groups.
  - Shared UI primitives and dense operational pages have been moved from
    hardcoded Tailwind palette classes to semantic tokens.
  - Settings impact cards use CSS custom properties for dark-aware dashed
    sensitive/critical backgrounds.
- Theme selector:
  - Settings > Apparence supports light/dark mode plus independent palette
    variants.
  - Dark variants: Teal, Bleu ardoise, Violet profond.
  - Light variants: Neutre, Chaleureux, Frais.
  - Preferences persist in localStorage as `prestix_theme`,
    `prestix_dark_variant`, and `prestix_light_variant`.
  - DOM attributes stay separate: `data-theme` for dark variants and
    `data-light-theme` for light variants.
- Notifications:
  - API: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read`, `DELETE /api/notifications/:id`.
  - Client: `/notifications` page, sidebar entry, and header unread bell.
  - Event producers: expired proformas, penalty accrual, credit conversion/hold, upcoming installments, commission edit requests.
- Mail/SMTP foundation:
  - Env keys: `MAIL_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`; fallback `SMTP_PASSWORD`/`SMTP_FROM`.
  - Settings keys: `mail_enabled`, `mail_automatic_reminders_enabled`, `mail_document_auto_send_enabled`, `mail_sender_name`.
  - Admin API: `/api/notifications/mail/status`, `/api/notifications/mail/test`, `/api/notifications/mail/outbox`.
  - Gmail needs an App Password, not the normal account password.
- Resolved hardening:
  - `recordPayment()` overpayment-to-credit now creates the credit lot inside the payment transaction.
  - Auto-converted epargne deposits show `(converti)` on Party detail via `agentId == null`.
- Reporting exports now include dashboard-aligned graph data:
  - PDF: inline SVG charts for CA/gain, service trend, commission-type trend, plus recent sales.
  - Excel: graph-oriented sheets with numeric data and static text-bar visual columns; no ExcelJS conditional-formatting data bars because Excel repaired/removed those.
- Open: apply notification/mail + company-party migrations, smoke Aide/contextual help/company-party/PDF flows, mail template visual refinement, retry UX, runtime smoke for Sprint 11c/11e/11f UI flows, Settings theme selector persistence/visual smoke, dark/light visual smoke on dense pages, full reporting/analyse API-runtime smoke, Sprint 9 credit-conversion fee-pair deep check.
