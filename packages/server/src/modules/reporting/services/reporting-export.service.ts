import ExcelJS from "exceljs";
import {
  getCaComposition,
  getClientKpis,
  getApporteurKpis,
  getEmployeKpis,
  getOverdueAndUnpaidSummary,
  getEpargneSoldeNetPeriode,
} from "./reporting.service.js";
import type { DateRangeParams } from "./reporting.types.js";

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

// One workbook, one sheet per section — mirrors the dashboard's own structure
// (CA composition, then each KPI table, then the two single-source-of-truth
// summaries) rather than dumping everything into one flat sheet.
export async function generateReportingExcel(params: DateRangeParams): Promise<Buffer> {
  const [caComposition, clientKpis, apporteurKpis, employeKpis, overdueSummary, epargneSolde] =
    await Promise.all([
      getCaComposition(params),
      getClientKpis(params),
      getApporteurKpis(params),
      getEmployeKpis(params),
      getOverdueAndUnpaidSummary(),
      getEpargneSoldeNetPeriode(params),
    ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PrestiX";
  workbook.created = new Date();

  // ── CA Composition ──
  const caSheet = workbook.addWorksheet("Composition CA");
  caSheet.columns = [
    { header: "Bucket", key: "label", width: 32 },
    { header: "CA Brut (XAF)", key: "gross", width: 18 },
    { header: "Gain (XAF)", key: "gain", width: 18 },
  ];
  styleHeaderRow(caSheet.getRow(1));
  for (const b of caComposition.buckets) {
    caSheet.addRow({ label: b.label, gross: b.gross, gain: b.gain });
  }
  caSheet.addRow({});
  const totalRow = caSheet.addRow({
    label: "TOTAL",
    gross: caComposition.totalGross,
    gain: caComposition.totalGain,
  });
  totalRow.font = { bold: true };

  // ── KPI sheets — same 3-column shape for all three roles ──
  function addKpiSheet(name: string, rows: { name: string; volume: number; value: number }[]): void {
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

  addKpiSheet("KPI Client", clientKpis);
  addKpiSheet("KPI Apporteur", apporteurKpis);
  addKpiSheet("KPI Employé", employeKpis);

  // ── Summary — overdue/unpaid (single source) + épargne solde net ──
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

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
