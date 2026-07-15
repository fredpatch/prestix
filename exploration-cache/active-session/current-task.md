## Task

None active — Sprint 7 fully closed (2026-07-15). Awaiting direction on Sprint 8
(Commission Divers, M10).

## Sprint 7 close-out summary

Full PrestiShop & Stock module built and runtime-tested: stock articles/items/
movements, shop-line capture (article auto-fill, passenger dropdown-or-free-text,
proactive low-stock warning at quoting time), stock OUT on issue with real
idempotency, and the two distinct negative-stock rules confirmed separately —
manual ops always blocked (no override exists), issue-time OUT can be overridden
by manager+ only (confirmed via real negative onHand after override).

Corrected an initial scope misreading during planning: shop items ARE quotable
on proformas, not invoice-only as the spec's literal wording first suggested —
a real business scenario from Lucrèce (tickets + shop items priced together)
overrode that reading. Added proformaShopDetails mirroring the ticket pattern.

Four real bugs found and fixed, one of them serious enough to note for every
future zodResolver form: Zod's z.object() silently strips any key not declared
in the schema. The ShopFields UI wrote correctly to form state the whole time,
but shopDetails vanished on every submit with zero error, because lineSchema
never declared it. Invisible in the UI, invisible in typecheck — only caught
because the person checked the actual database directly instead of trusting
the screen. Also caught: proformaShopDetails table spec'd but never pushed,
invoice.service.ts only ever reading (never writing) shopDetails, and all
three PDF services never reading shopDetails.passengerName for the printed
client name.

One feature explicitly deferred at the person's own suggestion: a reusable
per-page guide/help panel. Correctly scoped as needing real content-authoring
work plus its own UX design pass, not a quick bolt-on. Logged in Notion.

## Next up

Sprint 8 — Commission Divers (M10). Not yet started. This is the first module
that's genuinely "autonomous" per spec — commission transactions never enter
the Proforma→Facture→BL flow at all, a real architectural departure from every
module built so far this session.
