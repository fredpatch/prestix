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
} from "../../../db/schema.js";
import { eq, and, gte, lte, inArray, isNull } from "drizzle-orm";
import { getCreances } from "../../penalties/services/creance.service.js";
import { listLowStockArticles } from "../../stock/services/stock.service.js";
import type {
  CaCompositionBucket,
  CaCompositionResult,
  DashboardSummary,
  DateRangeParams,
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
  const to = new Date(params.to);

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
  const to = new Date(params.to);

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
  const to = new Date(params.to);

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
  const to = new Date(params.to);

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
  const to = new Date(params.to);

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
  const to = new Date(params.to);

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
  const to = new Date(params.to);

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
export async function getEmployeKpis(params: DateRangeParams): Promise<KpiRow[]> {
  const from = new Date(params.from);
  const to = new Date(params.to);

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

  const byAgent = new Map<number, { volume: number; value: number }>();

  for (const inv of agentInvoices) {
    const current = byAgent.get(inv.createdBy) ?? { volume: 0, value: 0 };
    current.volume += 1;
    current.value += parseFloat(inv.totalAmount);
    byAgent.set(inv.createdBy, current);
  }

  for (const c of agentCommissions) {
    if (!c.agentId) continue; // system-originated rows (none for commissions today, but stay defensive)
    const current = byAgent.get(c.agentId) ?? { volume: 0, value: 0 };
    current.volume += 1;
    current.value += parseFloat(c.commissionAmount);
    byAgent.set(c.agentId, current);
  }

  if (byAgent.size === 0) return [];
  const agentRows = await db.select().from(users).where(inArray(users.id, [...byAgent.keys()]));
  const nameById = new Map(agentRows.map((u) => [u.id, u.fullName]));

  return Array.from(byAgent.entries())
    .map(([id, agg]) => ({ id, name: nameById.get(id) ?? `Agent #${id}`, ...agg }))
    .sort((a, b) => b.value - a.value);
}
