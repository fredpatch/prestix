## Task

Apply the intended contents of `docs/diffs/next-step.diff`, update
exploration-cache and `changelog.md`, then commit and push.

## Current Project State

The patch file was malformed, but its intended changes were doc-only and have
been applied manually to `TASKS.md`.

Verified code state:

1. Overpayment-to-credit is now atomic: `createCreditLot()` accepts an optional
   transaction handle and `recordPayment()` passes its own transaction.
2. Auto-converted epargne deposits are labeled in party detail with a
   `(converti)` badge when `agentId == null`.
3. The remaining Sprint 9 hardening item is only the deeper independent
   credit-conversion fee-pair verification.

## Not Yet Done

- Commit and push the documentation/cache/changelog sync.
- Runtime smoke notification/mail migrations and document-email behavior.
- Full reporting/analyse API-runtime smoke end-to-end.
- Manual runtime smoke of the Sprint 11c/11e/11f UI flows still remains open.
- Sprint 9 credit-conversion fee-pair deep check remains flagged.
