import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  commissionTransactions,
  invoiceLines,
  invoices,
  parties,
  shopDetails,
  ticketDetails,
  users,
} from "../../../db/schema.js";
import { getBoolValue, getIntValue } from "../../settings/services/settings.service.js";
import type { RewardAudience, RewardDateRange, RewardRow, RewardRule, RewardSummary } from "./rewards.types.js";

function endOfDay(date: string): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function money(value: string | number): number {
  return typeof value === "number" ? value : parseFloat(value);
}

function startOfCurrentMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function parseRewardDateRange(query: { from?: unknown; to?: unknown }): RewardDateRange {
  return {
    from: typeof query.from === "string" ? query.from : startOfCurrentMonth(),
    to: typeof query.to === "string" ? query.to : today(),
  };
}

async function getRewardRules(): Promise<{ globalEnabled: boolean; rules: Record<RewardAudience, RewardRule> }> {
  const globalEnabled = await getBoolValue("rewards_enabled", true);

  async function ruleFor(audience: RewardAudience): Promise<RewardRule> {
    return {
      audience,
      enabled: await getBoolValue(`rewards_${audience}_enabled`, true),
      thresholdGain: await getIntValue(`rewards_${audience}_threshold_gain`, 0),
      rateBps: await getIntValue(`rewards_${audience}_rate_bps`, 0),
      fixedAmount: await getIntValue(`rewards_${audience}_fixed_amount`, 0),
    };
  }

  return {
    globalEnabled,
    rules: {
      client: await ruleFor("client"),
      referrer: await ruleFor("referrer"),
      employee: await ruleFor("employee"),
    },
  };
}

async function getIssuedInvoices(range: RewardDateRange) {
  return db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "issued"),
        gte(invoices.issuedAt, new Date(range.from)),
        lte(invoices.issuedAt, endOfDay(range.to)),
      ),
    );
}

async function getInvoiceGainById(invoiceIds: number[]): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (invoiceIds.length === 0) return result;

  const lines = await db.select().from(invoiceLines).where(inArray(invoiceLines.invoiceId, invoiceIds));
  const ticketLineIds = lines.filter((line) => line.lineType === "ticket").map((line) => line.id);
  const shopLineIds = lines.filter((line) => line.lineType === "shop").map((line) => line.id);

  const ticketRows =
    ticketLineIds.length > 0
      ? await db.select().from(ticketDetails).where(inArray(ticketDetails.invoiceLineId, ticketLineIds))
      : [];
  const shopRows =
    shopLineIds.length > 0
      ? await db.select().from(shopDetails).where(inArray(shopDetails.invoiceLineId, shopLineIds))
      : [];

  const ticketByLine = new Map(ticketRows.map((row) => [row.invoiceLineId, row]));
  const shopByLine = new Map(shopRows.map((row) => [row.invoiceLineId, row]));

  for (const line of lines) {
    const current = result.get(line.invoiceId) ?? 0;
    const gross = money(line.lineTotal);
    let supplierCost = 0;

    if (line.lineType === "ticket") {
      supplierCost = money(ticketByLine.get(line.id)?.supplierPrice ?? 0);
    } else if (line.lineType === "shop") {
      supplierCost = money(shopByLine.get(line.id)?.supplierPrice ?? 0) * line.quantity;
    }

    result.set(line.invoiceId, current + gross - supplierCost);
  }

  return result;
}

function addAgg(map: Map<number, { gain: number; volume: number }>, id: number, gain: number): void {
  const current = map.get(id) ?? { gain: 0, volume: 0 };
  current.gain += gain;
  current.volume += 1;
  map.set(id, current);
}

function estimate(rule: RewardRule, gain: number, globalEnabled: boolean): { eligible: boolean; estimatedReward: number } {
  const eligible = globalEnabled && rule.enabled && gain > 0 && gain >= rule.thresholdGain;
  if (!eligible) return { eligible, estimatedReward: 0 };
  return { eligible, estimatedReward: Math.round(rule.fixedAmount + (gain * rule.rateBps) / 10000) };
}

async function buildPartyRows(
  audience: "client" | "referrer",
  map: Map<number, { gain: number; volume: number }>,
  rule: RewardRule,
  globalEnabled: boolean,
): Promise<RewardRow[]> {
  if (map.size === 0) return [];
  const partyRows = await db.select().from(parties).where(inArray(parties.id, [...map.keys()]));
  const nameById = new Map(partyRows.map((party) => [party.id, party.tradeName ?? party.fullName]));

  return [...map.entries()]
    .map(([id, agg]) => {
      const reward = estimate(rule, agg.gain, globalEnabled);
      return {
        id,
        name: nameById.get(id) ?? `Partie #${id}`,
        audience,
        gain: agg.gain,
        volume: agg.volume,
        eligible: reward.eligible,
        estimatedReward: reward.estimatedReward,
        rule,
      };
    })
    .sort((a, b) => b.gain - a.gain);
}

async function buildEmployeeRows(
  map: Map<number, { gain: number; volume: number }>,
  rule: RewardRule,
  globalEnabled: boolean,
): Promise<RewardRow[]> {
  if (map.size === 0) return [];
  const userRows = await db.select().from(users).where(inArray(users.id, [...map.keys()]));
  const nameById = new Map(userRows.map((user) => [user.id, user.fullName]));

  return [...map.entries()]
    .map(([id, agg]) => {
      const reward = estimate(rule, agg.gain, globalEnabled);
      return {
        id,
        name: nameById.get(id) ?? `Employe #${id}`,
        audience: "employee" as const,
        gain: agg.gain,
        volume: agg.volume,
        eligible: reward.eligible,
        estimatedReward: reward.estimatedReward,
        rule,
      };
    })
    .sort((a, b) => b.gain - a.gain);
}

async function getRewardRows(range: RewardDateRange): Promise<{
  globalEnabled: boolean;
  rules: Record<RewardAudience, RewardRule>;
  clients: RewardRow[];
  referrers: RewardRow[];
  employees: RewardRow[];
}> {
  const [{ globalEnabled, rules }, invoiceRows, commissionRows] = await Promise.all([
    getRewardRules(),
    getIssuedInvoices(range),
    db
      .select()
      .from(commissionTransactions)
      .where(
        and(
          eq(commissionTransactions.active, true),
          gte(commissionTransactions.date, range.from),
          lte(commissionTransactions.date, range.to),
        ),
      ),
  ]);

  const invoiceGainById = await getInvoiceGainById(invoiceRows.map((invoice) => invoice.id));
  const clients = new Map<number, { gain: number; volume: number }>();
  const referrers = new Map<number, { gain: number; volume: number }>();
  const employees = new Map<number, { gain: number; volume: number }>();

  for (const invoice of invoiceRows) {
    const gain = invoiceGainById.get(invoice.id) ?? 0;
    addAgg(clients, invoice.partyId, gain);
    addAgg(employees, invoice.createdBy, gain);
    if (invoice.referrerPartyId) addAgg(referrers, invoice.referrerPartyId, gain);
  }

  for (const commission of commissionRows) {
    const gain = money(commission.commissionAmount);
    addAgg(employees, commission.agentId, gain);
    if (commission.clientPartyId) addAgg(clients, commission.clientPartyId, gain);
    if (commission.referrerPartyId) addAgg(referrers, commission.referrerPartyId, gain);
  }

  return {
    globalEnabled,
    rules,
    clients: await buildPartyRows("client", clients, rules.client, globalEnabled),
    referrers: await buildPartyRows("referrer", referrers, rules.referrer, globalEnabled),
    employees: await buildEmployeeRows(employees, rules.employee, globalEnabled),
  };
}

export async function getRewardClients(range: RewardDateRange): Promise<RewardRow[]> {
  return (await getRewardRows(range)).clients;
}

export async function getRewardReferrers(range: RewardDateRange): Promise<RewardRow[]> {
  return (await getRewardRows(range)).referrers;
}

export async function getRewardEmployees(range: RewardDateRange): Promise<RewardRow[]> {
  return (await getRewardRows(range)).employees;
}

export async function getRewardSummary(range: RewardDateRange): Promise<RewardSummary> {
  const rows = await getRewardRows(range);
  const all = [...rows.clients, ...rows.referrers, ...rows.employees];
  const eligible = all.filter((row) => row.eligible);

  return {
    period: range,
    globalEnabled: rows.globalEnabled,
    basis: "gain",
    mode: "preview",
    totals: {
      monitoredGain: all.reduce((total, row) => total + row.gain, 0),
      eligibleGain: eligible.reduce((total, row) => total + row.gain, 0),
      estimatedRewards: eligible.reduce((total, row) => total + row.estimatedReward, 0),
      eligibleClients: rows.clients.filter((row) => row.eligible).length,
      eligibleReferrers: rows.referrers.filter((row) => row.eligible).length,
      eligibleEmployees: rows.employees.filter((row) => row.eligible).length,
    },
    rules: [rows.rules.client, rows.rules.referrer, rows.rules.employee],
    topRows: {
      clients: rows.clients.slice(0, 5),
      referrers: rows.referrers.slice(0, 5),
      employees: rows.employees.slice(0, 5),
    },
  };
}
