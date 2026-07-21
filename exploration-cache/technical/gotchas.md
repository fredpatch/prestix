# Gotchas

## [Category: Dev Environment]

### npm scripts on Windows MINGW64

Run scripts from within the target package (e.g. packages/server), not the monorepo root — EXCEPT `npm run dev` at root, which uses `concurrently` + `npm:` script refs (workspace-resolved by npm itself, not cwd-dependent). Safe from root on MINGW64.

## [Category: TypeScript Tooling]

### TS5103 on `ignoreDeprecations`

`npm run typecheck -w packages/server` can fail when TypeScript version and tsconfig `ignoreDeprecations` value are incompatible. Keep tsconfig aligned with the installed `typescript` version before using typecheck as a quality gate. Correct value for TS 5.5–5.9 is `"5.0"`.

**Recurring regression (Sprint 1):** this value reverted from the fix back to the broken `"6.0"` twice during Sprint 1, likely from pasting a stale local copy of `tsconfig.base.json` that predates the fix. If typecheck suddenly fails with TS5103 again, check this value first before assuming new code broke something.

### `composite: true` breaks JSON imports in the client

`packages/client/tsconfig.json` inherits `composite: true` from `tsconfig.base.json` (needed for the server/shared-types project-reference build chain). The client doesn't need it — it's a leaf package nothing references — and `composite: true` causes TS6307 errors on JSON module imports (e.g. `i18n/en.json`). Client tsconfig explicitly sets `"composite": false` to override the inherited value.

## [Category: Docker Runtime]

### Compose commands fail when Docker Desktop engine is down

If `docker compose up` reports named pipe `//./pipe/dockerDesktopLinuxEngine` unavailable, the daemon is not running. Start Docker Desktop/engine first; then retry compose and health checks.

## [Category: Reporting Exports]

### ExcelJS conditional-formatting data bars can corrupt generated reports

During the Dashboard report alignment pass, Excel graph sheets first used
`worksheet.addConditionalFormatting({ type: "dataBar" })`. A real generated
workbook opened with an Excel repair prompt, and the repair stripped the graph
layer. Do not reintroduce ExcelJS `dataBar` conditional formatting for these
exports.

Current safe pattern: keep real numeric trend columns and add ordinary text
bar companion columns such as `CA brut - vue`. Excel treats those as normal
cell values, so the workbook opens without repair while still giving users a
quick visual scan.
