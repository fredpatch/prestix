1. Apply notification/mail migrations, restart the server, and smoke
   `/api/notifications` plus the `/notifications` client page.
2. Apply the company-party migration
   `20260723070400_sleepy_madame_web` before testing company parties.
3. Smoke Aide and guide UX: `/aide`, contextual help panel, guide trigger
   steps, role-gated topics, and mobile sheet behavior.
4. Smoke company parties: create/edit individual vs company, trade-name
   validation, clearing company-only fields, and PDF buyer/RCCM labels.
5. Smoke notification actions: unread/all filters, pagination, read-one,
   read-all, archive, unread badge refresh, and system-generated rows from
   commission edits/proforma expiry/jobs.
6. Smoke SMTP controls: Settings `mail_enabled`, admin mail status, test
   send, and `mail_outbox` sent/failed persistence.
7. Next mail phase: document email templates, invoice/proforma/BL PDF
   attachments, automatic reminders behind settings toggles, retry controls,
   and delivery diagnostics.
8. Generate fresh Dashboard quick PDF and Excel reports from the running app
   and open them manually. Confirm PDF charts render, Excel opens without
   repair, and the graph sheets show numeric data plus static "vue" bars.
9. Full reporting/analyse API-runtime smoke across summary, trends, KPIs,
   exports, employee drill-down, creances, and party-history commercial
   display.
10. Runtime smoke Sprint 11c/11e/11f UI flows: React Query mutation toasts,
   audit-log filters, mobile sidebar/tabs, document detail preview toggles,
   invoice/proforma quick views, dashboard section toggles.
11. Runtime visual smoke dark/light theme switching on shared form controls,
   tables, grids, charts, Settings impact cards, dense mobile pages, and modal
   surfaces.
12. Runtime smoke Settings > Apparence: light/dark mode, Teal/Bleu/Violet dark
   variants, Neutre/Chaleureux/Frais light variants, reload persistence, and
   switching modes without clobbering the other mode's saved palette.
13. FLAGGED, not closed (Sprint 9): credit-conversion path's fee-visibility
   fix needs deeper independent testing.
14. Open question from Sprint 6: should PNR/GDS/ticket-number appear on the
   printed document itself, or stay internal-only?
