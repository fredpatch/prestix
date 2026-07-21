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
  proformas,
  proformaLines,
} from "../../../db/schema.js";
import { eq, and, gte, lte, inArray, isNull, desc } from "drizzle-orm";
import { getCreances } from "../../penalties/services/creance.service.js";
import { listLowStockArticles } from "../../stock/services/stock.service.js";
import type {
  AccrualVsCashComparison,
  ActivityRow,
  CaCompositionBucket,
  CaCompositionResult,
  CreanceByParty,
  DashboardSummary,
  DateRangeParams,
  EmployeeActivityDetail,
  EmployeeKpiRow,
  EpargneSoldeNetPeriode,
  KpiRow,
  OpenEngagements,
  CommissionTypeTrendRow,
  RecentSaleRow,
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
      billetterie: { bucketKey: "billetterie", label: "Billetterie", gross: 0, gain: 0, volume: 0 },
      prestishop: { bucketKey: "prestishop", label: "PrestiShop", gross: 0, gain: 0, volume: 0 },
    };
  }

  const qualifyingInvoices = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(...invoiceConditions));
  const invoiceIds = qualifyingInvoices.map((i) => i.id);

  let ticketGross = 0;
  let ticketGain = 0;
  let ticketVolume = 0;
  let shopGross = 0;
  let shopGain = 0;
  let shopVolume = 0;

  if (invoiceIds.length > 0) {
    const lines = await db
      .select()
      .from(invoiceLines)
      .where(inArray(invoiceLines.invoiceId, invoiceIds));

    const ticketLineIds = lines.filter((l) => l.lineType === "ticket").map((l) => l.id);
    const shopLineIds = lines.filter((l) => l.lineType === "shop").map((l) => l.id);

    const ticketDetailRows =
      ticketLineIds.length > 0
        ? await db
            .select()
            .from(ticketDetails)
            .where(inArray(ticketDetails.invoiceLineId, ticketLineIds))
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
        ticketVolume += 1;
        const td = ticketDetailByLineId.get(line.id);
        // Ticket quantity is always 1 (M8 spec: one passenger per line), so
        // supplierPrice needs no quantity multiplier here.
        const supplierCost = td ? parseFloat(td.supplierPrice) : 0;
        ticketGain += lineTotal - supplierCost;
      } else if (line.lineType === "shop") {
        shopGross += lineTotal;
        shopVolume += 1;
        const sd = shopDetailByLineId.get(line.id);
        // Shop supplierPrice IS per-unit, unlike ticket — quantity matters here.
        const supplierCost = sd ? parseFloat(sd.supplierPrice) * line.quantity : 0;
        shopGain += lineTotal - supplierCost;
      }
    }
  }

  return {
    billetterie: {
      bucketKey: "billetterie",
      label: "Billetterie",
      gross: ticketGross,
      gain: ticketGain,
      volume: ticketVolume,
    },
    prestishop: {
      bucketKey: "prestishop",
      label: "PrestiShop",
      gross: shopGross,
      gain: shopGain,
      volume: shopVolume,
    },
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
  const totalsByType = new Map<string, { total: number; volume: number }>();
  for (const row of rows) {
    const current = totalsByType.get(row.type) ?? { total: 0, volume: 0 };
    current.total += parseFloat(row.commissionAmount);
    current.volume += 1;
    totalsByType.set(row.type, current);
  }

  return Array.from(totalsByType.entries()).map(([type, agg]) => ({
    bucketKey: `commission:${type}`,
    label: `Commission — ${labelByCode.get(type) ?? type}`,
    gross: agg.total,
    gain: agg.total, // full, no cost, per spec
    volume: agg.volume,
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
  return {
    bucketKey: "epargne_inscription",
    label: "Épargne — Frais d'inscription",
    gross: total,
    gain: total,
    volume: rows.length,
  };
}

async function getPenaltyBucket(params: DateRangeParams): Promise<CaCompositionBucket> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);

  let total = 0;
  let volume = 0;
  if (params.basis === "accrual") {
    // Revenue recognized when EARNED — the accrual rows themselves.
    const rows = await db
      .select()
      .from(penalties)
      .where(
        and(
          isNull(penalties.voidedAt),
          gte(penalties.accruedAt, from),
          lte(penalties.accruedAt, to),
        ),
      );
    total = rows.reduce((sum, r) => sum + parseFloat(r.amountXaf), 0);
    volume = rows.length;
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
    volume = rows.length;
  }

  return { bucketKey: "penalty", label: "Pénalités", gross: total, gain: total, volume };
}

// Bucket granularity adapts to range length — a 6-month range bucketed by day
// would be unreadable, a 5-day range bucketed by month would be useless.
function pickBucketGranularity(from: Date, to: Date): "day" | "week" | "month" {
  const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 31) return "day";
  if (days <= 180) return "week";
  return "month";
}

function bucketKeyFor(date: Date, granularity: "day" | "week" | "month"): string {
  if (granularity === "day") return date.toISOString().split("T")[0];
  if (granularity === "month")
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  // week — Monday-anchored, per ISO convention
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().split("T")[0];
}

// "Évolution dans le temps" — Lucrèce's own ask, not in the original M12
// spec. Deliberately self-contained rather than refactoring
// getTicketAndShopBuckets/getCommissionBuckets/etc. to also support bucketing
// — those are tested, working aggregation functions; duplicating a slightly
// different query here is safer than risking them for a new, different need.
// Scoped to TOTAL gross+gain per bucket for this first pass, not a
// per-category breakdown — that's a real "more later" if the section grows,
// per Fred's own framing.
export async function getCaTrend(
  params: DateRangeParams,
): Promise<{ bucket: string; gross: number; gain: number }[]> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);
  const granularity = pickBucketGranularity(from, to);

  const buckets = new Map<string, { gross: number; gain: number }>();
  function add(date: Date, gross: number, gain: number) {
    const key = bucketKeyFor(date, granularity);
    const current = buckets.get(key) ?? { gross: 0, gain: 0 };
    current.gross += gross;
    current.gain += gain;
    buckets.set(key, current);
  }

  // Ticket/shop — accrual basis only for the trend (a cash-basis trend would
  // need per-payment bucketing, real added complexity deferred for now).
  const issuedInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(eq(invoices.status, "issued"), gte(invoices.issuedAt, from), lte(invoices.issuedAt, to)),
    );
  const invoiceIds = issuedInvoices.map((i) => i.id);
  const issuedAtById = new Map(issuedInvoices.map((i) => [i.id, i.issuedAt!]));

  if (invoiceIds.length > 0) {
    const lines = await db
      .select()
      .from(invoiceLines)
      .where(inArray(invoiceLines.invoiceId, invoiceIds));
    const ticketLineIds = lines.filter((l) => l.lineType === "ticket").map((l) => l.id);
    const shopLineIds = lines.filter((l) => l.lineType === "shop").map((l) => l.id);
    const ticketDetailRows =
      ticketLineIds.length > 0
        ? await db
            .select()
            .from(ticketDetails)
            .where(inArray(ticketDetails.invoiceLineId, ticketLineIds))
        : [];
    const shopDetailRows =
      shopLineIds.length > 0
        ? await db.select().from(shopDetails).where(inArray(shopDetails.invoiceLineId, shopLineIds))
        : [];
    const ticketDetailByLineId = new Map(ticketDetailRows.map((t) => [t.invoiceLineId, t]));
    const shopDetailByLineId = new Map(shopDetailRows.map((s) => [s.invoiceLineId, s]));

    for (const line of lines) {
      const invoiceDate = issuedAtById.get(line.invoiceId);
      if (!invoiceDate) continue;
      const lineTotal = parseFloat(line.lineTotal);
      if (line.lineType === "ticket") {
        const td = ticketDetailByLineId.get(line.id);
        add(invoiceDate, lineTotal, lineTotal - (td ? parseFloat(td.supplierPrice) : 0));
      } else if (line.lineType === "shop") {
        const sd = shopDetailByLineId.get(line.id);
        add(
          invoiceDate,
          lineTotal,
          lineTotal - (sd ? parseFloat(sd.supplierPrice) * line.quantity : 0),
        );
      }
    }
  }

  // Commission — full amount, no cost, own date field.
  const commissionRows = await db
    .select()
    .from(commissionTransactions)
    .where(
      and(
        eq(commissionTransactions.active, true),
        gte(commissionTransactions.date, params.from),
        lte(commissionTransactions.date, params.to),
      ),
    );
  for (const c of commissionRows) {
    const amount = parseFloat(c.commissionAmount);
    add(new Date(c.date), amount, amount);
  }

  // Épargne inscription fee — full amount, no cost.
  const feeRows = await db
    .select()
    .from(savingsAccounts)
    .where(and(gte(savingsAccounts.createdAt, from), lte(savingsAccounts.createdAt, to)));
  for (const a of feeRows) {
    const amount = parseFloat(a.inscriptionFeeAmount);
    add(a.createdAt, amount, amount);
  }

  // Penalty — accrual rows, full amount, no cost.
  const penaltyRows = await db
    .select()
    .from(penalties)
    .where(
      and(isNull(penalties.voidedAt), gte(penalties.accruedAt, from), lte(penalties.accruedAt, to)),
    );
  for (const p of penaltyRows) {
    const amount = parseFloat(p.amountXaf);
    add(p.accruedAt, amount, amount);
  }

  return Array.from(buckets.entries())
    .map(([bucket, v]) => ({ bucket, gross: v.gross, gain: v.gain }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
}

// Same "évolution dans le temps" need as getCaTrend, but per major category
// instead of one combined total — Services tab's whole point. Kept to 5
// top-level categories (not one line per commission sub-type) so the chart
// stays readable regardless of how many commission types the catalog grows
// to. Same self-contained-rather-than-refactored reasoning as getCaTrend.
export async function getServiceTrend(params: DateRangeParams): Promise<
  {
    bucket: string;
    billetterie: number;
    prestishop: number;
    commission: number;
    epargne: number;
    penalty: number;
  }[]
> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);
  const granularity = pickBucketGranularity(from, to);

  const buckets = new Map<
    string,
    {
      billetterie: number;
      prestishop: number;
      commission: number;
      epargne: number;
      penalty: number;
    }
  >();
  function ensure(key: string) {
    if (!buckets.has(key))
      buckets.set(key, { billetterie: 0, prestishop: 0, commission: 0, epargne: 0, penalty: 0 });
    return buckets.get(key)!;
  }

  const issuedInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(eq(invoices.status, "issued"), gte(invoices.issuedAt, from), lte(invoices.issuedAt, to)),
    );
  const invoiceIds = issuedInvoices.map((i) => i.id);
  const issuedAtById = new Map(issuedInvoices.map((i) => [i.id, i.issuedAt!]));

  if (invoiceIds.length > 0) {
    const lines = await db
      .select()
      .from(invoiceLines)
      .where(inArray(invoiceLines.invoiceId, invoiceIds));
    for (const line of lines) {
      const invoiceDate = issuedAtById.get(line.invoiceId);
      if (!invoiceDate) continue;
      const key = bucketKeyFor(invoiceDate, granularity);
      const lineTotal = parseFloat(line.lineTotal);
      if (line.lineType === "ticket") ensure(key).billetterie += lineTotal;
      else if (line.lineType === "shop") ensure(key).prestishop += lineTotal;
    }
  }

  const commissionRows = await db
    .select()
    .from(commissionTransactions)
    .where(
      and(
        eq(commissionTransactions.active, true),
        gte(commissionTransactions.date, params.from),
        lte(commissionTransactions.date, params.to),
      ),
    );
  for (const c of commissionRows) {
    ensure(bucketKeyFor(new Date(c.date), granularity)).commission += parseFloat(
      c.commissionAmount,
    );
  }

  const feeRows = await db
    .select()
    .from(savingsAccounts)
    .where(and(gte(savingsAccounts.createdAt, from), lte(savingsAccounts.createdAt, to)));
  for (const a of feeRows) {
    ensure(bucketKeyFor(a.createdAt, granularity)).epargne += parseFloat(a.inscriptionFeeAmount);
  }

  const penaltyRows = await db
    .select()
    .from(penalties)
    .where(
      and(isNull(penalties.voidedAt), gte(penalties.accruedAt, from), lte(penalties.accruedAt, to)),
    );
  for (const p of penaltyRows) {
    ensure(bucketKeyFor(p.accruedAt, granularity)).penalty += parseFloat(p.amountXaf);
  }

  return Array.from(buckets.entries())
    .map(([bucket, v]) => ({ bucket, ...v }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
}

export async function getCommissionTypeTrend(
  params: DateRangeParams,
): Promise<CommissionTypeTrendRow[]> {
  const from = new Date(params.from);
  const to = endOfDay(params.to);
  const granularity = pickBucketGranularity(from, to);

  const [commissionRows, typeRows] = await Promise.all([
    db
      .select()
      .from(commissionTransactions)
      .where(
        and(
          eq(commissionTransactions.active, true),
          gte(commissionTransactions.date, params.from),
          lte(commissionTransactions.date, params.to),
        ),
      ),
    db.select().from(commissionTypeCatalog),
  ]);

  const labelByCode = new Map(typeRows.map((row) => [row.code, row.label]));
  const buckets = new Map<string, Record<string, number>>();

  for (const row of commissionRows) {
    const bucket = bucketKeyFor(new Date(row.date), granularity);
    const label = labelByCode.get(row.type) ?? row.type;
    const current = buckets.get(bucket) ?? {};
    current[label] = (current[label] ?? 0) + parseFloat(row.commissionAmount);
    buckets.set(bucket, current);
  }

  return Array.from(buckets.entries())
    .map(([bucket, series]) => ({ bucket, series }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
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
export async function getEpargneSoldeNetPeriode(
  params: DateRangeParams,
): Promise<EpargneSoldeNetPeriode> {
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
export async function getRecentActivity(
  limit = 10,
  transactionOnly = true,
): Promise<ActivityRow[]> {
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
  const userRows =
    userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
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

export async function getRecentSales(limit = 5): Promise<RecentSaleRow[]> {
  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.status, "issued"))
    .orderBy(desc(invoices.issuedAt))
    .limit(limit);

  const paymentRows = await db
    .select()
    .from(payments)
    .orderBy(desc(payments.createdAt))
    .limit(limit);

  const commissionRows = await db
    .select()
    .from(commissionTransactions)
    .where(eq(commissionTransactions.active, true))
    .orderBy(desc(commissionTransactions.createdAt))
    .limit(limit);

  const partyIds = [
    ...new Set([
      ...invoiceRows.map((row) => row.partyId),
      ...commissionRows
        .flatMap((row) => [row.clientPartyId, row.referrerPartyId])
        .filter((id): id is number => !!id),
    ]),
  ];
  const invoiceIds = [
    ...new Set([...paymentRows.map((row) => row.invoiceId), ...invoiceRows.map((row) => row.id)]),
  ];
  const userIds = [
    ...new Set([
      ...invoiceRows.map((row) => row.createdBy),
      ...paymentRows.map((row) => row.agentId).filter((id): id is number => !!id),
      ...commissionRows.map((row) => row.agentId).filter((id): id is number => !!id),
    ]),
  ];
  const commissionTypes = [...new Set(commissionRows.map((row) => row.type))];

  const [partyRows, relatedInvoices, userRows, typeRows] = await Promise.all([
    partyIds.length > 0
      ? db.select().from(parties).where(inArray(parties.id, partyIds))
      : Promise.resolve([]),
    invoiceIds.length > 0
      ? db.select().from(invoices).where(inArray(invoices.id, invoiceIds))
      : Promise.resolve([]),
    userIds.length > 0
      ? db.select().from(users).where(inArray(users.id, userIds))
      : Promise.resolve([]),
    commissionTypes.length > 0
      ? db
          .select()
          .from(commissionTypeCatalog)
          .where(inArray(commissionTypeCatalog.code, commissionTypes))
      : Promise.resolve([]),
  ]);

  const partyNameById = new Map(partyRows.map((row) => [row.id, row.fullName]));
  const invoiceById = new Map(relatedInvoices.map((row) => [row.id, row]));
  const userNameById = new Map(userRows.map((row) => [row.id, row.fullName]));
  const typeLabelByCode = new Map(typeRows.map((row) => [row.code, row.label]));

  const rows: RecentSaleRow[] = [
    ...invoiceRows.map((row) => ({
      id: `invoice:${row.id}`,
      kind: "invoice" as const,
      title: row.number ?? `Facture #${row.id}`,
      subtitle: "Facture émise",
      amount: parseFloat(row.totalAmount),
      partyName: partyNameById.get(row.partyId),
      agentName: userNameById.get(row.createdBy),
      occurredAt: row.issuedAt ?? row.createdAt,
      href: `/invoices/${row.id}`,
    })),
    ...paymentRows.map((row) => {
      const invoice = invoiceById.get(row.invoiceId);
      return {
        id: `payment:${row.id}`,
        kind: "payment" as const,
        title: invoice?.number ?? `Facture #${row.invoiceId}`,
        subtitle: "Paiement encaissé",
        amount: parseFloat(row.amountApplied),
        partyName: invoice ? partyNameById.get(invoice.partyId) : undefined,
        agentName: row.agentId ? userNameById.get(row.agentId) : undefined,
        occurredAt: row.createdAt,
        href: `/invoices/${row.invoiceId}`,
      };
    }),
    ...commissionRows.map((row) => ({
      id: `commission:${row.id}`,
      kind: "commission" as const,
      title: typeLabelByCode.get(row.type) ?? row.type,
      subtitle: "Commission enregistrée",
      amount: parseFloat(row.commissionAmount),
      partyName:
        (row.clientPartyId ? partyNameById.get(row.clientPartyId) : undefined) ??
        (row.referrerPartyId ? partyNameById.get(row.referrerPartyId) : undefined),
      agentName: row.agentId ? userNameById.get(row.agentId) : undefined,
      occurredAt: new Date(row.date),
      href: "/commissions",
    })),
  ];

  return rows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, limit);
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

// "Qui doit" — Lucrèce's own phrase. Same getCreances() single source as
// everywhere else, just grouped by party instead of shown per-échéance —
// a party can owe across several invoices/installments, this collapses that
// into one figure per party for the "who owes the agency" question.
export async function getCreancesByParty(): Promise<CreanceByParty[]> {
  const rows = await getCreances(false);
  const byParty = new Map<
    number,
    {
      partyName: string;
      principalDue: number;
      penaltyDue: number;
      overdueCount: number;
      unpaidCount: number;
    }
  >();

  for (const r of rows) {
    const current = byParty.get(r.partyId) ?? {
      partyName: r.partyName,
      principalDue: 0,
      penaltyDue: 0,
      overdueCount: 0,
      unpaidCount: 0,
    };
    current.principalDue += parseFloat(r.principalDue);
    current.penaltyDue += parseFloat(r.penaltyDue);
    current.unpaidCount += 1;
    if (r.isOverdue) current.overdueCount += 1;
    byParty.set(r.partyId, current);
  }

  return Array.from(byParty.entries())
    .map(([partyId, agg]) => ({
      partyId,
      partyName: agg.partyName,
      principalDue: agg.principalDue,
      penaltyDue: agg.penaltyDue,
      totalDue: agg.principalDue + agg.penaltyDue,
      overdueCount: agg.overdueCount,
      unpaidCount: agg.unpaidCount,
    }))
    .sort((a, b) => b.totalDue - a.totalDue);
}

// "Combien on gagne" vs "combien on gagne réellement" — SIDE BY SIDE, not the
// toggle used everywhere else. Two full composition runs, one per basis.
export async function getAccrualVsCashComparison(
  params: Omit<DateRangeParams, "basis">,
): Promise<AccrualVsCashComparison> {
  const [accrual, cash] = await Promise.all([
    getCaComposition({ ...params, basis: "accrual" }),
    getCaComposition({ ...params, basis: "cash" }),
  ]);
  return {
    accrual: { totalGross: accrual.totalGross, totalGain: accrual.totalGain },
    cash: { totalGross: cash.totalGross, totalGain: cash.totalGain },
  };
}

// "Engagements non clôturés" — business not yet committed: invoices still in
// draft (never issued) and proformas still "live" (not expired/cancelled AND
// not yet promoted — same promoted-check as the double-promotion guard in
// invoice.service.ts, reused here for consistency rather than re-derived).
export async function getOpenEngagements(): Promise<OpenEngagements> {
  const draftInvoices = await db.select().from(invoices).where(eq(invoices.status, "draft"));
  const draftInvoiceValue = draftInvoices.reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);

  const liveProformas = await db.select().from(proformas).where(eq(proformas.status, "draft"));
  const promotedProformaIds = new Set(
    (await db.select({ proformaId: invoices.proformaId }).from(invoices))
      .map((r) => r.proformaId)
      .filter((id): id is number => id != null),
  );
  const openProformas = liveProformas.filter((p) => !promotedProformaIds.has(p.id));

  let openProformaValue = 0;
  if (openProformas.length > 0) {
    const lines = await db
      .select()
      .from(proformaLines)
      .where(
        inArray(
          proformaLines.proformaId,
          openProformas.map((p) => p.id),
        ),
      );
    openProformaValue = lines.reduce((sum, l) => sum + parseFloat(l.lineTotal), 0);
  }

  return {
    draftInvoiceCount: draftInvoices.length,
    draftInvoiceValue,
    openProformaCount: openProformas.length,
    openProformaValue,
  };
}

export async function getDashboardSummary(params: DateRangeParams): Promise<DashboardSummary> {
  const [caComposition, overdueAndUnpaid, lowStockCount, epargneSoldeNetPeriode] =
    await Promise.all([
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

  const rows = await db
    .select()
    .from(invoices)
    .where(and(...conditions));

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

async function resolvePartyNames(
  byParty: Map<number, { volume: number; value: number }>,
): Promise<KpiRow[]> {
  if (byParty.size === 0) return [];
  const partyRows = await db
    .select()
    .from(parties)
    .where(inArray(parties.id, [...byParty.keys()]));
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
  const agentRows = await db
    .select()
    .from(users)
    .where(inArray(users.id, [...byAgent.keys()]));
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
    .where(
      and(
        eq(payments.agentId, agentId),
        gte(payments.createdAt, from),
        lte(payments.createdAt, to),
      ),
    );
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
      and(
        eq(stockMovements.agentId, agentId),
        gte(stockMovements.createdAt, from),
        lte(stockMovements.createdAt, to),
      ),
    );
  const articleIds = [...new Set(agentStockMovements.map((m) => m.articleId))];
  const articles =
    articleIds.length > 0
      ? await db.select().from(stockArticles).where(inArray(stockArticles.id, articleIds))
      : [];
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
    invoicePartyIds.length > 0
      ? await db.select().from(parties).where(inArray(parties.id, invoicePartyIds))
      : [];
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
