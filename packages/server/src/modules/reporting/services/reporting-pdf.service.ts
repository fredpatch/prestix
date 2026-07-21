import fs from "node:fs";
import path from "node:path";
import { generatePdf } from "../../../utils/pdf.js";
import { renderDashboardReportHtml } from "../templates/dashboard-report.template.js";
import {
  getCaComposition,
  getOverdueAndUnpaidSummary,
  getLowStockCount,
  getEpargneSoldeNetPeriode,
  getClientKpis,
  getApporteurKpis,
  getEmployeKpis,
  getCreancesByParty,
  getAccrualVsCashComparison,
  getOpenEngagements,
  getCaTrend,
  getServiceTrend,
  getCommissionTypeTrend,
  getRecentSales,
} from "./reporting.service.js";
import type { DateRangeParams } from "./reporting.types.js";
import { type ReportModule } from "./reporting-export.service.js";
import {
  formatChartBucket,
  renderGroupedBarChartSvg,
  renderLineChartSvg,
} from "./reporting-chart.service.js";

let cachedLogoBase64: string | null = null;
function getLogoBase64(): string {
  if (cachedLogoBase64) return cachedLogoBase64;
  const logoPath = path.resolve(process.cwd(), "../client/public/brand/logo.jpg");
  cachedLogoBase64 = `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString("base64")}`;
  return cachedLogoBase64;
}

function fmtDateShort(d: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }).format(
    new Date(d),
  );
}

// Module selection mirrors the Excel export exactly (Rapports tab, per
// Fred's ask — previously the PDF was a fixed single shape while Excel could
// already pick sections; this closes that gap). Defaults to ["global"] only
// when omitted — NOT every module — because the Dashboard page's own
// existing "Rapport rapide" button calls this with no modules param at all,
// and that button's whole intent is a quick glance, not a full report. The
// Rapports tab always passes its own explicit selection, so this default
// only ever matters for that one pre-existing caller.
export async function generateDashboardReportPdf(
  params: DateRangeParams,
  modules: ReportModule[] = ["global"],
): Promise<Buffer> {
  const [global, clients, referrers, employes, services, creances, dashboard] = await Promise.all([
    modules.includes("global") ? buildGlobalSection(params) : Promise.resolve(undefined),
    modules.includes("clients_referents") ? getClientKpis(params) : Promise.resolve(undefined),
    modules.includes("clients_referents") ? getApporteurKpis(params) : Promise.resolve(undefined),
    modules.includes("employes") ? getEmployeKpis(params) : Promise.resolve(undefined),
    modules.includes("services") ? buildServicesSection(params) : Promise.resolve(undefined),
    modules.includes("creances") ? buildCreancesSection(params) : Promise.resolve(undefined),
    modules.includes("global") ? buildDashboardChartsSection(params) : Promise.resolve(undefined),
  ]);

  const html = renderDashboardReportHtml({
    logoBase64: getLogoBase64(),
    from: fmtDateShort(params.from),
    to: fmtDateShort(params.to),
    basisLabel: params.basis === "cash" ? "Encaissement" : "Engagement",
    generatedAt: fmtDateShort(new Date().toISOString()),
    global,
    clients,
    referrers,
    employes,
    services,
    creances,
    dashboard,
  });

  return generatePdf(html);
}

async function buildDashboardChartsSection(params: DateRangeParams) {
  const [caTrend, serviceTrend, commissionTypeTrend, recentSales] = await Promise.all([
    getCaTrend(params),
    getServiceTrend(params),
    getCommissionTypeTrend(params),
    getRecentSales(5),
  ]);

  const serviceLabels = serviceTrend.map((row) => formatChartBucket(row.bucket));
  const commissionLabels = commissionTypeTrend.map((row) => formatChartBucket(row.bucket));
  const commissionSeriesLabels = Array.from(
    new Set(commissionTypeTrend.flatMap((row) => Object.keys(row.series))),
  );

  return {
    caTrendChart: renderGroupedBarChartSvg({
      title: "Evolution du CA brut et du gain",
      labels: caTrend.map((row) => formatChartBucket(row.bucket)),
      series: [
        { label: "CA brut", color: "#a77800", values: caTrend.map((row) => row.gross) },
        { label: "Gain", color: "#1a7a4c", values: caTrend.map((row) => row.gain) },
      ],
    }),
    serviceTrendChart: renderLineChartSvg({
      title: "Evolution des ventes par service",
      labels: serviceLabels,
      series: [
        { label: "Billetterie", color: "#a77800", values: serviceTrend.map((row) => row.billetterie) },
        { label: "PrestiShop", color: "#1a7a4c", values: serviceTrend.map((row) => row.prestishop) },
        { label: "Commissions", color: "#c08e3a", values: serviceTrend.map((row) => row.commission) },
        { label: "Epargne", color: "#5f6b7a", values: serviceTrend.map((row) => row.epargne) },
        { label: "Penalites", color: "#b03a2e", values: serviceTrend.map((row) => row.penalty) },
      ],
    }),
    commissionTypeChart: renderLineChartSvg({
      title: "Evolution des commissions par type",
      labels: commissionLabels,
      series: commissionSeriesLabels.map((label, index) => ({
        label,
        color: ["#a77800", "#1a7a4c", "#b03a2e", "#5f6b7a", "#0f766e", "#c2410c", "#7c3aed"][
          index % 7
        ],
        values: commissionTypeTrend.map((row) => row.series[label] ?? 0),
      })),
    }),
    recentSales: recentSales.map((sale) => ({
      title: sale.title,
      subtitle: sale.partyName ?? sale.subtitle ?? "",
      amount: sale.amount,
      kind: sale.kind,
      occurredAt: sale.occurredAt,
    })),
  };
}

async function buildGlobalSection(params: DateRangeParams) {
  const [composition, overdueAndUnpaid, lowStockCount, epargneSolde] = await Promise.all([
    getCaComposition(params),
    getOverdueAndUnpaidSummary(),
    getLowStockCount(),
    getEpargneSoldeNetPeriode(params),
  ]);
  return {
    caComposition: composition.buckets.map((b) => ({ label: b.label, gross: b.gross, gain: b.gain })),
    totalGross: composition.totalGross,
    totalGain: composition.totalGain,
    overdueCount: overdueAndUnpaid.overdueCount,
    overdueAmount: overdueAndUnpaid.overdueAmount,
    unpaidCount: overdueAndUnpaid.unpaidCount,
    unpaidAmount: overdueAndUnpaid.unpaidAmount,
    lowStockCount,
    epargneNetChange: epargneSolde.netChange,
  };
}

async function buildServicesSection(params: DateRangeParams) {
  const composition = await getCaComposition(params);
  return composition.buckets.map((b) => ({ label: b.label, volume: b.volume, gross: b.gross, gain: b.gain }));
}

async function buildCreancesSection(params: DateRangeParams) {
  const [byParty, comparison, engagements] = await Promise.all([
    getCreancesByParty(),
    getAccrualVsCashComparison({ from: params.from, to: params.to }),
    getOpenEngagements(),
  ]);
  return {
    byParty: byParty.map((p) => ({
      partyName: p.partyName,
      principalDue: p.principalDue,
      penaltyDue: p.penaltyDue,
      totalDue: p.totalDue,
      overdueCount: p.overdueCount,
    })),
    comparison: {
      accrual: { gross: comparison.accrual.totalGross, gain: comparison.accrual.totalGain },
      cash: { gross: comparison.cash.totalGross, gain: comparison.cash.totalGain },
    },
    engagements,
  };
}
