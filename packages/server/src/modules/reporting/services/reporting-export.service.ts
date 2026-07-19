import ExcelJS from "exceljs";
import {
  getCaComposition,
  getClientKpis,
  getApporteurKpis,
  getEmployeKpis,
  getOverdueAndUnpaidSummary,
  getEpargneSoldeNetPeriode,
  getCreancesByParty,
  getAccrualVsCashComparison,
  getOpenEngagements,
} from "./reporting.service.js";
import type { DateRangeParams } from "./reporting.types.js";

export type ReportModule = "global" | "employes" | "clients_referents" | "services" | "creances";
export const ALL_REPORT_MODULES: ReportModule[] = ["global", "employes", "clients_referents", "services", "creances"];

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFDDC99A" }, // matches the brand-gold used across every printed document
};

function styleHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true };
  });
}

function addKpiSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: { name: string; volume: number; value: number }[],
): void {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { header: "Nom", key: "name", width: 28 },
    { header: "Volume", key: "volume", width: 12 },
    { header: "Valeur (XAF)", key: "value", width: 18 },
  ];
  styleHeaderRow(sheet.getRow(1));
  for (const r of rows) sheet.addRow(r);
  if (rows.length === 0) {
    sheet.addRow({ name: "Aucune donnée pour cette période", volume: "", value: "" });
  }
}

// One workbook, one sheet per section — mirrors the Analyse page's own tab
// structure. `modules` lets the caller pick exactly which tabs' data to
// include (Rapports tab, per Fred's own ask — the export was previously
// always the same fixed "everything" shape regardless of which tab was
// active, which is exactly the mismatch he flagged). Defaults to every
// module when omitted, preserving the Dashboard page's own quick-export
// button exactly as it already worked — this is additive, not a behavior
// change for existing callers.
export async function generateReportingExcel(
  params: DateRangeParams,
  modules: ReportModule[] = ALL_REPORT_MODULES,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PrestiX";
  workbook.created = new Date();

  if (modules.includes("global")) {
    const [caComposition, overdueSummary, epargneSolde] = await Promise.all([
      getCaComposition(params),
      getOverdueAndUnpaidSummary(),
      getEpargneSoldeNetPeriode(params),
    ]);

    const caSheet = workbook.addWorksheet("Composition CA");
    caSheet.columns = [
      { header: "Bucket", key: "label", width: 32 },
      { header: "CA Brut (XAF)", key: "gross", width: 18 },
      { header: "Gain (XAF)", key: "gain", width: 18 },
    ];
    styleHeaderRow(caSheet.getRow(1));
    for (const b of caComposition.buckets) caSheet.addRow({ label: b.label, gross: b.gross, gain: b.gain });
    caSheet.addRow({});
    const totalRow = caSheet.addRow({ label: "TOTAL", gross: caComposition.totalGross, gain: caComposition.totalGain });
    totalRow.font = { bold: true };

    const summarySheet = workbook.addWorksheet("Résumé");
    summarySheet.columns = [
      { header: "Indicateur", key: "label", width: 36 },
      { header: "Valeur", key: "value", width: 20 },
    ];
    styleHeaderRow(summarySheet.getRow(1));
    summarySheet.addRow({ label: "Créances en retard (nombre)", value: overdueSummary.overdueCount });
    summarySheet.addRow({ label: "Créances en retard (montant XAF)", value: overdueSummary.overdueAmount });
    summarySheet.addRow({ label: "Impayées, toutes (nombre)", value: overdueSummary.unpaidCount });
    summarySheet.addRow({ label: "Impayées, toutes (montant XAF)", value: overdueSummary.unpaidAmount });
    summarySheet.addRow({});
    summarySheet.addRow({ label: "Épargne — Dépôts période (XAF)", value: epargneSolde.totalDeposits });
    summarySheet.addRow({ label: "Épargne — Retraits période (XAF)", value: epargneSolde.totalWithdrawals });
    summarySheet.addRow({ label: "Épargne — Solde net période (XAF)", value: epargneSolde.netChange });
  }

  if (modules.includes("clients_referents")) {
    const [clientKpis, apporteurKpis] = await Promise.all([getClientKpis(params), getApporteurKpis(params)]);
    addKpiSheet(workbook, "KPI Client", clientKpis);
    addKpiSheet(workbook, "KPI Apporteur", apporteurKpis);
  }

  if (modules.includes("employes")) {
    const employeKpis = await getEmployeKpis(params);
    addKpiSheet(workbook, "KPI Employé", employeKpis);
  }

  if (modules.includes("services")) {
    const caComposition = await getCaComposition(params);
    const sheet = workbook.addWorksheet("Services");
    sheet.columns = [
      { header: "Service", key: "label", width: 32 },
      { header: "Volume", key: "volume", width: 12 },
      { header: "CA Brut (XAF)", key: "gross", width: 18 },
      { header: "Gain (XAF)", key: "gain", width: 18 },
    ];
    styleHeaderRow(sheet.getRow(1));
    for (const b of caComposition.buckets) {
      sheet.addRow({ label: b.label, volume: b.volume, gross: b.gross, gain: b.gain });
    }
  }

  if (modules.includes("creances")) {
    const [creances, comparison, engagements] = await Promise.all([
      getCreancesByParty(),
      getAccrualVsCashComparison({ from: params.from, to: params.to }),
      getOpenEngagements(),
    ]);

    const creancesSheet = workbook.addWorksheet("Créances par partie");
    creancesSheet.columns = [
      { header: "Partie", key: "partyName", width: 28 },
      { header: "Principal dû (XAF)", key: "principalDue", width: 18 },
      { header: "Pénalités dues (XAF)", key: "penaltyDue", width: 18 },
      { header: "Total dû (XAF)", key: "totalDue", width: 18 },
      { header: "Échéances en retard", key: "overdueCount", width: 16 },
    ];
    styleHeaderRow(creancesSheet.getRow(1));
    for (const c of creances) {
      creancesSheet.addRow({
        partyName: c.partyName,
        principalDue: c.principalDue,
        penaltyDue: c.penaltyDue,
        totalDue: c.totalDue,
        overdueCount: c.overdueCount,
      });
    }

    const engagementsSheet = workbook.addWorksheet("Engagements");
    engagementsSheet.columns = [
      { header: "Indicateur", key: "label", width: 36 },
      { header: "Valeur", key: "value", width: 20 },
    ];
    styleHeaderRow(engagementsSheet.getRow(1));
    engagementsSheet.addRow({ label: "Engagement — CA Brut (XAF)", value: comparison.accrual.totalGross });
    engagementsSheet.addRow({ label: "Engagement — Gain (XAF)", value: comparison.accrual.totalGain });
    engagementsSheet.addRow({ label: "Encaissement — CA Brut (XAF)", value: comparison.cash.totalGross });
    engagementsSheet.addRow({ label: "Encaissement — Gain (XAF)", value: comparison.cash.totalGain });
    engagementsSheet.addRow({});
    engagementsSheet.addRow({ label: "Factures en brouillon (nombre)", value: engagements.draftInvoiceCount });
    engagementsSheet.addRow({ label: "Factures en brouillon (valeur XAF)", value: engagements.draftInvoiceValue });
    engagementsSheet.addRow({ label: "Proformas ouverts (nombre)", value: engagements.openProformaCount });
    engagementsSheet.addRow({ label: "Proformas ouverts (valeur XAF)", value: engagements.openProformaValue });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
