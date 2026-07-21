## Task

Update exploration-cache and `changelog.md` after the Sprint 11d
Notifications/mail foundation pass, then commit and push all current changes.

## Current Project State

Sprint 11d first pass is implemented in code:

1. In-app notification center: backend schema/migrations, API routes, unread
   counts, read/archive actions, client route/page, sidebar entry, and header
   unread bell.
2. Notification producers: expired proformas, penalty accrual summaries,
   credit conversion/held-for-review, upcoming invoice installments, and
   commission edit request lifecycle events.
3. SMTP/Gmail foundation: mailer config, admin status/test endpoints, mail
   outbox persistence, `.env.example` guidance, Settings-managed mail toggles,
   and corrected success/error feedback for test sends.

## Not Yet Done

- Apply the two new notification/mail migrations and restart the server before
  runtime smoke.
- Runtime smoke notification center: unread/all filters, read-one, read-all,
  archive, unread badge refresh, and generated system notifications.
- Runtime smoke mail: admin status panel, test send, outbox sent/failed row,
  and `mail_enabled` behavior.
- Next mail phase: document email templates, PDF attachments, automatic
  reminders, retry controls, and delivery diagnostics.
- Manual runtime smoke of the Sprint 11c/11e/11f UI flows still remains open.
- Full reporting/analyse API-runtime smoke end-to-end still remains open.
- Sprint 9 credit-conversion fee-pair deep check remains flagged.
- Auto-converted epargne deposits still need a visible converted/source label.

## Validation Snapshot (2026-07-21)

- `npm run typecheck`: PASS.
- Root `npm run build`: PASS after elevated rerun for known Windows
  Vite/esbuild `spawn EPERM`; existing client chunk-size warning remains.
