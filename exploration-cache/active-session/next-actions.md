1. Apply notification/mail migrations, restart the server, and smoke
   `/api/notifications` plus the `/notifications` client page.
2. Smoke notification actions: unread/all filters, pagination, read-one,
   read-all, archive, unread badge refresh, and system-generated rows from
   commission edits/proforma expiry/jobs.
3. Smoke SMTP controls: Settings `mail_enabled`, admin mail status, test
   send, and `mail_outbox` sent/failed persistence.
4. Next mail phase: document email templates, invoice/proforma/BL PDF
   attachments, automatic reminders behind settings toggles, retry controls,
   and delivery diagnostics.
5. Generate fresh Dashboard quick PDF and Excel reports from the running app
   and open them manually. Confirm PDF charts render, Excel opens without
   repair, and the graph sheets show numeric data plus static "vue" bars.
6. Full reporting/analyse API-runtime smoke across summary, trends, KPIs,
   exports, employee drill-down, creances, and party-history commercial
   display.
7. Runtime smoke Sprint 11c/11e/11f UI flows: React Query mutation toasts,
   audit-log filters, mobile sidebar/tabs, document detail preview toggles,
   invoice/proforma quick views, dashboard section toggles.
8. FLAGGED, not closed (Sprint 9): credit-conversion path's fee-visibility
   fix needs deeper independent testing.
9. Deferred hardening item: retrofit remaining hardcoded neutral-/brand-
   Tailwind pages to semantic tokens for fuller dark-mode coverage.
10. Open question from Sprint 6: should PNR/GDS/ticket-number appear on the
   printed document itself, or stay internal-only?
