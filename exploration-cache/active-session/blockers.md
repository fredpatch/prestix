- No active delivery blocker recorded.
- Cancelled/moot: Sprint 11 Mongo->PG migration and its Beta data-access
  dependency. The legacy tripwise-monorepo is now treated as a reference
  oracle, not a production dataset to migrate.
- Still open as business/product clarification, not a migration blocker:
  company-type party fields in real usage.
- Product validation needed: freshly generated PDF/Excel reports should be
  opened manually after the export repair. ExcelJS conditional-formatting
  data bars caused Excel to repair the workbook and strip the visual layer, so
  report graph sheets now use safe static text-bar columns instead.
