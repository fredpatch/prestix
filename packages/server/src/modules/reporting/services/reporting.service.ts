import { db } from "../../../db/index.js";
import {
  invoices,
  invoiceLines,
  ticketDetails,
  shopDetails,
  commissionTransactions,
  commissionTypeCatalog,
  savingsAccounts,
  savingsTransactions,
  penalties,
  payments,
  parties,
  users,
  auditLog,
  stockMovements,
  stockArticles,
} from "../../../db/schema.js";
import { eq, and, gte, lte, inArray, isNull, desc } from "drizzle-orm";
import { getCreances } from "../../penalties/services/creance.service.js";
import { listLowStockArticles } from "../../stock/services/stock.service.js";
import type {
  ActivityRow,
  CaCompositionBucket,
  CaCompositionResult,
  DashboardSummary,
  DateRangeParams,
  EmployeeActivityDetail,
  EmployeeKpiRow,
  EpargneSoldeNetPeriode,
  KpiRow,
} from "./reporting.types.js";

// Accrual/cash means something different per bucket — stated explicitly here
// since the spec doesn't spell out the mechanics per bucket, and this is the
// one place that decision actually gets encoded:
//   - Billetterie/PrestiShop: accrual = invoice issuedAt; cash = invoice has
//     ANY payment within range (not prorated across partial payments — the
//     full line value counts the moment the invoice qualifies).
//   - Commission/Épargne-inscription: no real cash-vs-accrual distinction —
//     both settle at the moment they're recorded, so the same date field is
//     used regardless of the toggle.
//   - Penalty: accrual = when EARNED (penalties.accruedAt); cash = actual
//     penalty PAYMENTS received (payments.allocationTarget='penalty'), not
//     the accrual rows — this is the one bucket where the toggle genuinely
//     changes which underlying rows get summed, not just which date column.

// Real, widespread bug fixed here: `new Date("2026-07-17")` parses as
// midnight UTC at the START of that day, not the end. Every `lte(column, to)`
// comparison against a timestamp column was silently excluding anything that
// happened LATER that same day — which is almost everything, since real
// timestamps rarely land exactly at midnight. This affected every date-range
// query in this file (8 separate occurrences), not just one metric — it just
// showed up most visibly wherever there was no other historical data to mask
// the missing "today" row. endOfDay() is now the ONLY way "to" gets turned
// into a Date for a `lte` comparison anywhere in this module.
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

async function invoiceIdsWithPaymentInRange(from: Date, to: Date): Promise<number[]> {
  const rows = await db
    .select({ invoiceId: payments.invoiceId })
    .from(payments)
    .where(and(gte(payments.createdAt, from), lte(payments.createdAt, to)));
  return [...new Set(rows.map((r) => r.invoiceId))];
}

async function getTicketAndShopBuckets(
  params: DateRangeParams,
): Promise<{ billetterie: CaCompositionBucket; prestishop: CaCompositionBucket }> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  let qualifyingInvoiceIds: number[] | null = null;
  if (params.basis === "cash") {
    qualifyingInvoiceIds = await invoiceIdsWithPaymentInRange(from, to);
  }

  const invoiceConditions = [eq(invoices.status, "issued")];
  if (params.basis === "accrual") {
    invoiceConditions.push(gte(invoices.issuedAt, from), lte(invoices.issuedAt, to));
  } else if (qualifyingInvoiceIds && qualifyingInvoiceIds.length > 0) {
    invoiceConditions.push(inArray(invoices.id, qualifyingInvoiceIds));
  } else if (params.basis === "cash") {
    // No invoices had a qualifying payment at all — buckets are legitimately
    // zero, not "query returned everything" (inArray with an empty array
    // behaves oddly across drivers, so this is handled explicitly).
    return {
      billetterie: { bucketKey: "billetterie", label: "Billetterie", gross: 0, gain: 0 },
      prestishop: { bucketKey: "prestishop", label: "PrestiShop", gross: 0, gain: 0 },
    };
  }

  const qualifyingInvoices = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(...invoiceConditions));
  const invoiceIds = qualifyingInvoices.map((i) => i.id);

  let ticketGross = 0;
  let ticketGain = 0;
  let shopGross = 0;
  let shopGain = 0;

  if (invoiceIds.length > 0) {
    const lines = await db
      .select()
      .from(invoiceLines)
      .where(inArray(invoiceLines.invoiceId, invoiceIds));

    const ticketLineIds = lines.filter((l) => l.lineType === "ticket").map((l) => l.id);
    const shopLineIds = lines.filter((l) => l.lineType === "shop").map((l) => l.id);

    const ticketDetailRows =
      ticketLineIds.length > 0
        ? await db.select().from(ticketDetails).where(inArray(ticketDetails.invoiceLineId, ticketLineIds))
        : [];
    const shopDetailRows =
      shopLineIds.length > 0
        ? await db.select().from(shopDetails).where(inArray(shopDetails.invoiceLineId, shopLineIds))
        : [];

    const ticketDetailByLineId = new Map(ticketDetailRows.map((t) => [t.invoiceLineId, t]));
    const shopDetailByLineId = new Map(shopDetailRows.map((s) => [s.invoiceLineId, s]));

    for (const line of lines) {
      const lineTotal = parseFloat(line.lineTotal); // gross = sellingPrice net of discount, per spec

      if (line.lineType === "ticket") {
        ticketGross += lineTotal;
        const td = ticketDetailByLineId.get(line.id);
        // Ticket quantity is always 1 (M8 spec: one passenger per line), so
        // supplierPrice needs no quantity multiplier here.
        const supplierCost = td ? parseFloat(td.supplierPrice) : 0;
        ticketGain += lineTotal - supplierCost;
      } else if (line.lineType === "shop") {
        shopGross += lineTotal;
        const sd = shopDetailByLineId.get(line.id);
        // Shop supplierPrice IS per-unit, unlike ticket — quantity matters here.
        const supplierCost = sd ? parseFloat(sd.supplierPrice) * line.quantity : 0;
        shopGain += lineTotal - supplierCost;
      }
    }
  }

  return {
    billetterie: { bucketKey: "billetterie", label: "Billetterie", gross: ticketGross, gain: ticketGain },
    prestishop: { bucketKey: "prestishop", label: "PrestiShop", gross: shopGross, gain: shopGain },
  };
}

async function getCommissionBuckets(params: DateRangeParams): Promise<CaCompositionBucket[]> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  // Commissions settle the moment they're recorded — no separate cash event,
  // so `date` is used regardless of the accrual/cash toggle.
  const rows = await db
    .select()
    .from(commissionTransactions)
    .where(
      and(
        eq(commissionTransactions.active, true),
        gte(commissionTransactions.date, params.from),
        lte(commissionTransactions.date, params.to),
      ),
    );

  const types = await db.select().from(commissionTypeCatalog);
  const labelByCode = new Map(types.map((t) => [t.code, t.label]));

  // Grouped dynamically by whatever types actually appear in the data — not
  // hardcoded to the 6 seeded types, since the catalog is explicitly
  // super_admin-extensible (confirmed working in Sprint 8 with "Course du
  // mois"). A new custom type shows up here automatically, no code change.
  const totalsByType = new Map<string, number>();
  for (const row of rows) {
    const current = totalsByType.get(row.type) ?? 0;
    totalsByType.set(row.type, current + parseFloat(row.commissionAmount));
  }

  return Array.from(totalsByType.entries()).map(([type, total]) => ({
    bucketKey: `commission:${type}`,
    label: `Commission — ${labelByCode.get(type) ?? type}`,
    gross: total,
    gain: total, // full, no cost, per spec
  }));
}

async function getEpargneInscriptionBucket(params: DateRangeParams): Promise<CaCompositionBucket> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  // Fee is collected at subscription moment — same date regardless of basis.
  const rows = await db
    .select()
    .from(savingsAccounts)
    .where(and(gte(savingsAccounts.createdAt, from), lte(savingsAccounts.createdAt, to)));

  const total = rows.reduce((sum, r) => sum + parseFloat(r.inscriptionFeeAmount), 0);
  return { bucketKey: "epargne_inscription", label: "Épargne — Frais d'inscription", gross: total, gain: total };
}

async function getPenaltyBucket(params: DateRangeParams): Promise<CaCompositionBucket> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  let total = 0;
  if (params.basis === "accrual") {
    // Revenue recognized when EARNED — the accrual rows themselves.
    const rows = await db
      .select()
      .from(penalties)
      .where(and(isNull(penalties.voidedAt), gte(penalties.accruedAt, from), lte(penalties.accruedAt, to)));
    total = rows.reduce((sum, r) => sum + parseFloat(r.amountXaf), 0);
  } else {
    // Actual money received — penalty PAYMENTS, not accrual rows. This is the
    // one bucket where cash-basis sums fundamentally different underlying
    // rows, not just a different date column on the same rows.
    const rows = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.allocationTarget, "penalty"),
          gte(payments.createdAt, from),
          lte(payments.createdAt, to),
        ),
      );
    total = rows.reduce((sum, r) => sum + parseFloat(r.amountApplied), 0);
  }

  return { bucketKey: "penalty", label: "Pénalités", gross: total, gain: total };
}

export async function getCaComposition(params: DateRangeParams): Promise<CaCompositionResult> {
  const { billetterie, prestishop } = await getTicketAndShopBuckets(params);
  const commissionBuckets = await getCommissionBuckets(params);
  const epargneBucket = await getEpargneInscriptionBucket(params);
  const penaltyBucket = await getPenaltyBucket(params);

  const buckets = [billetterie, prestishop, ...commissionBuckets, epargneBucket, penaltyBucket];
  const totalGross = buckets.reduce((sum, b) => sum + b.gross, 0);
  const totalGain = buckets.reduce((sum, b) => sum + b.gain, 0);

  return { buckets, totalGross, totalGain };
}

// "Solde net période" — a GLOBAL liquidity metric across every épargne
// account, explicitly NOT a client balance and NOT counted as CA (spec: both
// deposits and withdrawals are excluded from CA entirely). This deliberately
// includes the fee deposit+withdrawal pairs from Sprint 9 — they net to zero
// automatically within the same period, exactly as intended.
export async function getEpargneSoldeNetPeriode(params: DateRangeParams): Promise<EpargneSoldeNetPeriode> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  const rows = await db
    .select()
    .from(savingsTransactions)
    .where(
      and(
        eq(savingsTransactions.status, "recorded"),
        gte(savingsTransactions.recordedAt, from),
        lte(savingsTransactions.recordedAt, to),
      ),
    );

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  for (const r of rows) {
    const amount = parseFloat(r.totalAmount);
    if (r.nature === "deposit") totalDeposits += amount;
    else totalWithdrawals += amount;
  }

  return { totalDeposits, totalWithdrawals, netChange: totalDeposits - totalWithdrawals };
}

// Dashboard's "dernières actions" is meant to be scannable at a glance — real
// transactions and status changes, not every administrative/procedural audit
// row (a document print, a type edit request that was later rejected, etc.).
// The FULL unfiltered audit log stays available for a future dedicated
// "Journal d'audit" page — this whitelist only narrows what the DASHBOARD
// shows, it doesn't change what gets logged.
const TRANSACTION_ACTIONS = new Set([
  "INVOICE_ISSUED",
  "INVOICE_CANCELLED",
  "PAYMENT_RECORDED",
  "COMMISSION_TRANSACTION_CREATED",
  "COMMISSION_EDIT_APPROVED",
  "SAVINGS_ACCOUNT_OPENED",
  "SAVINGS_DEPOSIT_RECORDED",
  "SAVINGS_WITHDRAWAL_RECORDED",
  "SAVINGS_TRANSACTION_REVERSED",
  "CREDIT_AUTO_CONVERTED_TO_EPARGNE_SUBSCRIPTION",
  "CREDIT_AUTO_CONVERTED_TO_EPARGNE_DEPOSIT",
  "INSTALLMENT_RESCHEDULED",
]);

// Reads the audit trail every module has already been writing to all
// session — no new tracking needed, this is purely a display layer over
// logAudit() calls that already happen on every meaningful mutation
// (invoice issued, payment recorded, commission logged, stock movement,
// épargne movement, etc.).
export async function getRecentActivity(limit = 10, transactionOnly = true): Promise<ActivityRow[]> {
  // Over-fetch when filtering, since a chunk of the most recent rows may get
  // dropped by the whitelist — without this, a burst of "document printed"
  // rows could leave the dashboard showing fewer than `limit` items even
  // though older real transactions exist further back.
  const rows = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(transactionOnly ? limit * 5 : limit);

  const filtered = transactionOnly ? rows.filter((r) => TRANSACTION_ACTIONS.has(r.action)) : rows;
  const page = filtered.slice(0, limit);

  const userIds = [...new Set(page.map((r) => r.userId).filter((id): id is number => id != null))];
  const userRows = userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
  const nameById = new Map(userRows.map((u) => [u.id, u.fullName]));

  return page.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId ?? undefined,
    actorName: r.userId != null ? nameById.get(r.userId) : undefined,
    metadata: (r.metadata as Record<string, unknown>) ?? undefined,
    createdAt: r.createdAt,
  }));
}

export async function getLowStockCount(): Promise<number> {
  const rows = await listLowStockArticles();
  return rows.length;
}

// Reuses Sprint 5's créances aggregation directly — this IS the single source
// of truth for "overdue" the spec explicitly calls out as the legacy bug fix.
// Not re-derived here with a second ad-hoc filter.
export async function getOverdueAndUnpaidSummary(): Promise<{
  overdueCount: number;
  overdueAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
}> {
  const overdueRows = await getCreances(true);
  const allUnpaidRows = await getCreances(false);

  const sum = (rows: Awaited<ReturnType<typeof getCreances>>) =>
    rows.reduce((s, r) => s + parseFloat(r.principalDue) + parseFloat(r.penaltyDue), 0);

  return {
    overdueCount: overdueRows.length,
    overdueAmount: sum(overdueRows),
    unpaidCount: allUnpaidRows.length,
    unpaidAmount: sum(allUnpaidRows),
  };
}

export async function getDashboardSummary(params: DateRangeParams): Promise<DashboardSummary> {
  const [caComposition, overdueAndUnpaid, lowStockCount, epargneSoldeNetPeriode] = await Promise.all([
    getCaComposition(params),
    getOverdueAndUnpaidSummary(),
    getLowStockCount(),
    getEpargneSoldeNetPeriode(params),
  ]);

  return {
    caComposition,
    overdueCount: overdueAndUnpaid.overdueCount,
    overdueAmount: overdueAndUnpaid.overdueAmount,
    unpaidCount: overdueAndUnpaid.unpaidCount,
    unpaidAmount: overdueAndUnpaid.unpaidAmount,
    lowStockCount,
    epargneSoldeNetPeriode,
  };
}

// ── KPIs ─────────────────────────────────────────────────────────────────
// Client/Apporteur KPIs combine two sources per party (invoices for the
// buyer role, invoices.referrerPartyId + commission_transactions.referrerPartyId
// for the apporteur role) — merged in application code, same pattern already
// used for créances/commission-catalog aggregation rather than a single
// unwieldy SQL join.

export async function getClientKpis(params: DateRangeParams): Promise<KpiRow[]> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  const conditions = [eq(invoices.status, "issued")];
  if (params.basis === "accrual") {
    conditions.push(gte(invoices.issuedAt, from), lte(invoices.issuedAt, to));
  } else {
    const qualifyingIds = await invoiceIdsWithPaymentInRange(from, to);
    if (qualifyingIds.length === 0) return [];
    conditions.push(inArray(invoices.id, qualifyingIds));
  }

  const rows = await db.select().from(invoices).where(and(...conditions));

  const byParty = new Map<number, { volume: number; value: number }>();
  for (const inv of rows) {
    const current = byParty.get(inv.partyId) ?? { volume: 0, value: 0 };
    current.volume += 1;
    current.value += parseFloat(inv.totalAmount);
    byParty.set(inv.partyId, current);
  }

  return resolvePartyNames(byParty);
}

export async function getApporteurKpis(params: DateRangeParams): Promise<KpiRow[]> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  const invoiceConditions = [eq(invoices.status, "issued")];
  if (params.basis === "accrual") {
    invoiceConditions.push(gte(invoices.issuedAt, from), lte(invoices.issuedAt, to));
  } else {
    const qualifyingIds = await invoiceIdsWithPaymentInRange(from, to);
    if (qualifyingIds.length > 0) invoiceConditions.push(inArray(invoices.id, qualifyingIds));
  }

  const referredInvoices = await db
    .select()
    .from(invoices)
    .where(and(...invoiceConditions));

  const referredCommissions = await db
    .select()
    .from(commissionTransactions)
    .where(
      and(
        eq(commissionTransactions.active, true),
        gte(commissionTransactions.date, params.from),
        lte(commissionTransactions.date, params.to),
      ),
    );

  const byParty = new Map<number, { volume: number; value: number }>();

  for (const inv of referredInvoices) {
    if (!inv.referrerPartyId) continue;
    const current = byParty.get(inv.referrerPartyId) ?? { volume: 0, value: 0 };
    current.volume += 1;
    current.value += parseFloat(inv.totalAmount);
    byParty.set(inv.referrerPartyId, current);
  }

  for (const c of referredCommissions) {
    if (!c.referrerPartyId) continue;
    const current = byParty.get(c.referrerPartyId) ?? { volume: 0, value: 0 };
    current.volume += 1;
    current.value += parseFloat(c.commissionAmount);
    byParty.set(c.referrerPartyId, current);
  }

  return resolvePartyNames(byParty);
}

async function resolvePartyNames(byParty: Map<number, { volume: number; value: number }>): Promise<KpiRow[]> {
  if (byParty.size === 0) return [];
  const partyRows = await db.select().from(parties).where(inArray(parties.id, [...byParty.keys()]));
  const nameById = new Map(partyRows.map((p) => [p.id, p.fullName]));

  return Array.from(byParty.entries())
    .map(([id, agg]) => ({ id, name: nameById.get(id) ?? `Partie #${id}`, ...agg }))
    .sort((a, b) => b.value - a.value);
}

// Employé KPI: agentId means "who created/issued the invoice" for ticket/shop
// CA, and "who recorded the commission" for commission CA — combined per
// agent, matching "volume + value per agent" as a real performance metric,
// not a single ambiguous agentId field.
export async function getEmployeKpis(params: DateRangeParams): Promise<EmployeeKpiRow[]> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  const invoiceConditions = [eq(invoices.status, "issued")];
  if (params.basis === "accrual") {
    invoiceConditions.push(gte(invoices.issuedAt, from), lte(invoices.issuedAt, to));
  } else {
    const qualifyingIds = await invoiceIdsWithPaymentInRange(from, to);
    if (qualifyingIds.length > 0) invoiceConditions.push(inArray(invoices.id, qualifyingIds));
  }

  const agentInvoices = await db
    .select()
    .from(invoices)
    .where(and(...invoiceConditions));

  const agentCommissions = await db
    .select()
    .from(commissionTransactions)
    .where(
      and(
        eq(commissionTransactions.active, true),
        gte(commissionTransactions.date, params.from),
        lte(commissionTransactions.date, params.to),
      ),
    );

  // Volume-only categories (Lucrèce's ask: "volume d'action... dépendamment
  // des différentes activités de l'agence") — these don't feed CA/value, but
  // still count as real activity for prime/incentive decisions. Filtered by
  // their own timestamp regardless of basis — a stock movement or épargne
  // transaction doesn't have a meaningful "accrual vs cash" distinction of
  // its own, it just happened or it didn't.
  const agentPayments = await db
    .select()
    .from(payments)
    .where(and(gte(payments.createdAt, from), lte(payments.createdAt, to)));

  const agentStockMovements = await db
    .select()
    .from(stockMovements)
    .where(and(gte(stockMovements.createdAt, from), lte(stockMovements.createdAt, to)));

  const agentSavingsTransactions = await db
    .select()
    .from(savingsTransactions)
    .where(
      and(
        eq(savingsTransactions.status, "recorded"),
        gte(savingsTransactions.recordedAt, from),
        lte(savingsTransactions.recordedAt, to),
      ),
    );

  const byAgent = new Map<
    number,
    { volume: number; value: number; breakdown: EmployeeKpiRow["breakdown"] }
  >();

  function ensure(agentId: number) {
    if (!byAgent.has(agentId)) {
      byAgent.set(agentId, {
        volume: 0,
        value: 0,
        breakdown: {
          invoicesIssued: 0,
          paymentsRecorded: 0,
          commissionsLogged: 0,
          stockMovements: 0,
          savingsTransactions: 0,
        },
      });
    }
    return byAgent.get(agentId)!;
  }

  for (const inv of agentInvoices) {
    const current = ensure(inv.createdBy);
    current.volume += 1;
    current.value += parseFloat(inv.totalAmount);
    current.breakdown.invoicesIssued += 1;
  }

  for (const c of agentCommissions) {
    if (!c.agentId) continue; // system-originated rows (none for commissions today, but stay defensive)
    const current = ensure(c.agentId);
    current.volume += 1;
    current.value += parseFloat(c.commissionAmount);
    current.breakdown.commissionsLogged += 1;
  }

  for (const p of agentPayments) {
    if (!p.agentId) continue;
    ensure(p.agentId).breakdown.paymentsRecorded += 1;
  }

  for (const m of agentStockMovements) {
    ensure(m.agentId).breakdown.stockMovements += 1;
  }

  for (const s of agentSavingsTransactions) {
    if (!s.agentId) continue; // auto-conversion cron rows have no human agent
    ensure(s.agentId).breakdown.savingsTransactions += 1;
  }

  if (byAgent.size === 0) return [];
  const agentRows = await db.select().from(users).where(inArray(users.id, [...byAgent.keys()]));
  const nameById = new Map(agentRows.map((u) => [u.id, u.fullName]));

  return Array.from(byAgent.entries())
    .map(([id, agg]) => ({ id, name: nameById.get(id) ?? `Agent #${id}`, ...agg }))
    .sort((a, b) => b.value - a.value);
}

// The actual drill-down for one employee — real transaction rows across all
// five activity categories, not aggregated counts. This is what makes the
// Employé KPI usable for a real prime/incentive decision rather than just a
// leaderboard number.
export async function getEmployeeActivityDetail(
  agentId: number,
  params: DateRangeParams,
): Promise<EmployeeActivityDetail> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  const agentInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.createdBy, agentId),
        eq(invoices.status, "issued"),
        gte(invoices.issuedAt, from),
        lte(invoices.issuedAt, to),
      ),
    );

  const agentPayments = await db
    .select()
    .from(payments)
    .where(and(eq(payments.agentId, agentId), gte(payments.createdAt, from), lte(payments.createdAt, to)));
  const paymentInvoiceIds = [...new Set(agentPayments.map((p) => p.invoiceId))];
  const paymentInvoices =
    paymentInvoiceIds.length > 0
      ? await db.select().from(invoices).where(inArray(invoices.id, paymentInvoiceIds))
      : [];
  const invoiceNumberById = new Map(paymentInvoices.map((i) => [i.id, i.number ?? undefined]));

  const agentCommissions = await db
    .select()
    .from(commissionTransactions)
    .where(
      and(
        eq(commissionTransactions.agentId, agentId),
        eq(commissionTransactions.active, true),
        gte(commissionTransactions.date, params.from),
        lte(commissionTransactions.date, params.to),
      ),
    );
  const commissionTypes = await db.select().from(commissionTypeCatalog);
  const commissionLabelByCode = new Map(commissionTypes.map((t) => [t.code, t.label]));

  const agentStockMovements = await db
    .select()
    .from(stockMovements)
    .where(
      and(eq(stockMovements.agentId, agentId), gte(stockMovements.createdAt, from), lte(stockMovements.createdAt, to)),
    );
  const articleIds = [...new Set(agentStockMovements.map((m) => m.articleId))];
  const articles = articleIds.length > 0 ? await db.select().from(stockArticles).where(inArray(stockArticles.id, articleIds)) : [];
  const articleNameById = new Map(articles.map((a) => [a.id, a.name]));

  const agentSavingsTransactions = await db
    .select()
    .from(savingsTransactions)
    .where(
      and(
        eq(savingsTransactions.agentId, agentId),
        eq(savingsTransactions.status, "recorded"),
        gte(savingsTransactions.recordedAt, from),
        lte(savingsTransactions.recordedAt, to),
      ),
    );

  const invoicePartyIds = [...new Set(agentInvoices.map((i) => i.partyId))];
  const invoiceParties =
    invoicePartyIds.length > 0 ? await db.select().from(parties).where(inArray(parties.id, invoicePartyIds)) : [];
  const partyNameById = new Map(invoiceParties.map((p) => [p.id, p.fullName]));

  return {
    invoices: agentInvoices.map((i) => ({
      id: i.id,
      number: i.number ?? undefined,
      date: (i.issuedAt ?? i.createdAt).toISOString(),
      amount: parseFloat(i.totalAmount),
      partyName: partyNameById.get(i.partyId) ?? "—",
    })),
    payments: agentPayments.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      invoiceNumber: invoiceNumberById.get(p.invoiceId),
      date: p.createdAt.toISOString(),
      amount: parseFloat(p.amountApplied),
      method: p.method,
    })),
    commissions: agentCommissions.map((c) => ({
      id: c.id,
      type: c.type,
      typeLabel: commissionLabelByCode.get(c.type) ?? c.type,
      date: c.date,
      amount: parseFloat(c.commissionAmount),
    })),
    stockMovements: agentStockMovements.map((m) => ({
      id: m.id,
      articleName: articleNameById.get(m.articleId) ?? "—",
      type: m.type,
      quantity: m.quantity,
      date: m.createdAt.toISOString(),
    })),
    savingsTransactions: agentSavingsTransactions.map((s) => ({
      id: s.id,
      nature: s.nature,
      amount: parseFloat(s.totalAmount),
      date: (s.recordedAt ?? s.createdAt).toISOString(),
    })),
  };
}
