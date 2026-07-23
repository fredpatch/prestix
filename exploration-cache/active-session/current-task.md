## Task

Update exploration-cache and `changelog.md` after the latest pushed
application updates, then commit and push the documentation sync.

## Current Project State

Latest pushed code adds:

1. In-app Aide section with static Markdown topics and an `/aide` route.
2. Contextual help/guide triggers across major pages using `PageHeaderProvider`
   and a right-side `HelpPanel`.
3. Company-party support via `partyType`, `tradeName`, and `taxId`, including
   migration `20260723070400_sleepy_madame_web`.
4. Company-aware document PDFs that print trade name and optional RCCM/NIF.
5. Client-wide dark-mode/semantic-token retrofit across shared primitives,
   document pages, parties, dashboard/analyse, admin pages, notifications,
   mail outbox, stock, creances, commissions, users, aide, audit log, and
   Settings.

## Not Yet Done

- Runtime smoke notification/mail migrations and document-email behavior.
- Runtime smoke the Aide page, contextual guide triggers, and company-party
  create/edit/document PDF flows.
- Runtime visual smoke dark/light theme switching on dense pages, mobile
  screens, modals, tables, grids, and charts.
- Full reporting/analyse API-runtime smoke end-to-end.
- Manual runtime smoke of the Sprint 11c/11e/11f UI flows still remains open.
- Sprint 9 credit-conversion fee-pair deep check remains flagged.
