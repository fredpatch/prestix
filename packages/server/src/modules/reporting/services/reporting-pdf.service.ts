import fs from "node:fs";
import path from "node:path";
import { generatePdf } from "../../../utils/pdf.js";
import { renderDashboardReportHtml } from "../templates/dashboard-report.template.js";
import {
  getCaComposition,
  getOverdueAndUnpaidSummary,
  getLowStockCount,
  getEpargneSoldeNetPeriode,
} from "./reporting.service.js";
import type { DateRangeParams } from "./reporting.types.js";

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

export async function generateDashboardReportPdf(params: DateRangeParams): Promise<Buffer> {
  const [composition, overdueAndUnpaid, lowStockCount, epargneSolde] = await Promise.all([
    getCaComposition(params),
    getOverdueAndUnpaidSummary(),
    getLowStockCount(),
    getEpargneSoldeNetPeriode(params),
  ]);

  const html = renderDashboardReportHtml({
    logoBase64: getLogoBase64(),
    from: fmtDateShort(params.from),
    to: fmtDateShort(params.to),
    basisLabel: params.basis === "cash" ? "Encaissement" : "Engagement",
    generatedAt: fmtDateShort(new Date().toISOString()),
    caComposition: composition.buckets.map((b) => ({ label: b.label, gross: b.gross, gain: b.gain })),
    totalGross: composition.totalGross,
    totalGain: composition.totalGain,
    overdueCount: overdueAndUnpaid.overdueCount,
    overdueAmount: overdueAndUnpaid.overdueAmount,
    unpaidCount: overdueAndUnpaid.unpaidCount,
    unpaidAmount: overdueAndUnpaid.unpaidAmount,
    lowStockCount,
    epargneNetChange: epargneSolde.netChange,
  });

  return generatePdf(html);
}
