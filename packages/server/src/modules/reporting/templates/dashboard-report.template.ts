// Purpose-built for the reporting exports - deliberately NOT reusing
// invoice-print.template.ts (that template is shaped around a single
// document with one items table; this is a set of independent, optional
// summary sections). Every section is OPTIONAL now - mirrors Excel's own
// module-selection design (Rapports tab), so the PDF isn't stuck as a fixed
// single shape while Excel gets to pick sections. Puppeteer paginates
// multi-section output automatically via standard CSS page-break rules, no
// special multi-page logic needed here.

export interface GlobalSection {
  caComposition: { label: string; gross: number; gain: number }[];
  totalGross: number;
  totalGain: number;
  overdueCount: number;
  overdueAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
  lowStockCount: number;
  epargneNetChange: number;
}

export interface KpiSectionRow {
  name: string;
  volume: number;
  value: number;
}

export interface ServiceSectionRow {
  label: string;
  volume: number;
  gross: number;
  gain: number;
}

export interface CreancesSection {
  byParty: {
    partyName: string;
    principalDue: number;
    penaltyDue: number;
    totalDue: number;
    overdueCount: number;
  }[];
  comparison: { accrual: { gross: number; gain: number }; cash: { gross: number; gain: number } };
  engagements: {
    draftInvoiceCount: number;
    draftInvoiceValue: number;
    openProformaCount: number;
    openProformaValue: number;
  };
}

export interface DashboardChartsSection {
  caTrendChart: string;
  serviceTrendChart: string;
  commissionTypeChart: string;
  recentSales: {
    title: string;
    subtitle: string;
    amount: number;
    kind: "invoice" | "payment" | "commission";
    occurredAt: Date;
  }[];
}

export interface DashboardReportData {
  logoBase64: string;
  from: string; // already formatted, e.g. "15 juin 26"
  to: string;
  basisLabel: string; // "Engagement" | "Encaissement"
  generatedAt: string;
  global?: GlobalSection;
  employes?: KpiSectionRow[];
  clients?: KpiSectionRow[];
  referrers?: KpiSectionRow[];
  services?: ServiceSectionRow[];
  creances?: CreancesSection;
  dashboard?: DashboardChartsSection;
}

function fmt(v = 0): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

function esc(v: string | undefined): string {
  if (!v) return "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sectionTitle(title: string): string {
  return `<div class="r-section-title">${esc(title)}</div>`;
}

function renderGlobal(g: GlobalSection): string {
  const rows = g.caComposition
    .map(
      (b) =>
        `<tr><td>${esc(b.label)}</td><td class="r">${fmt(b.gross)}</td><td class="r">${fmt(b.gain)}</td></tr>`,
    )
    .join("");
  return `
    ${sectionTitle("Composition du CA")}
    <table class="r-table">
      <thead><tr><th>Bucket</th><th class="r">CA Brut (XAF)</th><th class="r">Gain (XAF)</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>TOTAL</td><td class="r">${fmt(g.totalGross)}</td><td class="r">${fmt(g.totalGain)}</td></tr></tfoot>
    </table>
    ${sectionTitle("Indicateurs clés")}
    <div class="r-cards">
      <div class="r-card">
        <div class="r-card-label">En retard</div>
        <div class="r-card-value warn">${fmt(g.overdueAmount)} XAF</div>
        <div class="r-card-sub">${g.overdueCount} échéance(s)</div>
      </div>
      <div class="r-card">
        <div class="r-card-label">Impayées (toutes)</div>
        <div class="r-card-value warn">${fmt(g.unpaidAmount)} XAF</div>
        <div class="r-card-sub">${g.unpaidCount} échéance(s)</div>
      </div>
      <div class="r-card">
        <div class="r-card-label">Stock bas</div>
        <div class="r-card-value">${g.lowStockCount}</div>
        <div class="r-card-sub">article(s) sous seuil</div>
      </div>
      <div class="r-card">
        <div class="r-card-label">Épargne - solde net période</div>
        <div class="r-card-value ${g.epargneNetChange >= 0 ? "good" : "warn"}">${fmt(g.epargneNetChange)} XAF</div>
        <div class="r-card-sub">Métrique globale, pas un solde client</div>
      </div>
    </div>`;
}

function renderDashboardCharts(section: DashboardChartsSection): string {
  const rows = section.recentSales.length
    ? section.recentSales
        .map(
          (sale) =>
            `<tr><td>${esc(sale.title)}</td><td>${esc(sale.subtitle)}</td><td>${esc(sale.kind)}</td><td>${new Intl.DateTimeFormat("fr-FR").format(sale.occurredAt)}</td><td class="r">${fmt(sale.amount)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="r-empty">Aucune vente recente.</td></tr>`;

  return `
    ${sectionTitle("Evolution du tableau de bord")}
    <div class="r-chart">${section.caTrendChart}</div>
    <div class="r-chart">${section.serviceTrendChart}</div>
    <div class="r-chart">${section.commissionTypeChart}</div>
    ${sectionTitle("Ventes recentes")}
    <table class="r-table">
      <thead><tr><th>Operation</th><th>Partie</th><th>Type</th><th>Date</th><th class="r">Montant (XAF)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderKpiTable(title: string, rows: KpiSectionRow[]): string {
  const body = rows.length
    ? rows
        .map(
          (r) =>
            `<tr><td>${esc(r.name)}</td><td class="r">${r.volume}</td><td class="r">${fmt(r.value)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="3" class="r-empty">Aucune donnée pour cette période.</td></tr>`;
  return `
    ${sectionTitle(title)}
    <table class="r-table">
      <thead><tr><th>Nom</th><th class="r">Volume</th><th class="r">Valeur (XAF)</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
}

function renderServices(rows: ServiceSectionRow[]): string {
  const body = rows.length
    ? rows
        .map(
          (r) =>
            `<tr><td>${esc(r.label)}</td><td class="r">${r.volume}</td><td class="r">${fmt(r.gross)}</td><td class="r">${fmt(r.gain)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="r-empty">Aucune donnée pour cette période.</td></tr>`;
  return `
    ${sectionTitle("Services")}
    <table class="r-table">
      <thead><tr><th>Service</th><th class="r">Volume</th><th class="r">CA Brut (XAF)</th><th class="r">Gain (XAF)</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
}

function renderCreances(c: CreancesSection): string {
  const rows = c.byParty.length
    ? c.byParty
        .map(
          (p) =>
            `<tr><td>${esc(p.partyName)}</td><td class="r">${fmt(p.principalDue)}</td><td class="r">${fmt(p.penaltyDue)}</td><td class="r">${fmt(p.totalDue)}</td><td class="r">${p.overdueCount}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="r-empty">Aucune créance en cours.</td></tr>`;
  return `
    ${sectionTitle("Ce qu'on gagne vs. ce qu'on encaisse réellement")}
    <div class="r-cards" style="grid-template-columns: repeat(2, 1fr);">
      <div class="r-card">
        <div class="r-card-label">Engagement</div>
        <div class="r-card-value">${fmt(c.comparison.accrual.gross)} XAF</div>
        <div class="r-card-sub">Gain : ${fmt(c.comparison.accrual.gain)} XAF</div>
      </div>
      <div class="r-card">
        <div class="r-card-label">Encaissement</div>
        <div class="r-card-value good">${fmt(c.comparison.cash.gross)} XAF</div>
        <div class="r-card-sub">Gain : ${fmt(c.comparison.cash.gain)} XAF</div>
      </div>
    </div>
    ${sectionTitle("Engagements non clôturés")}
    <div class="r-cards" style="grid-template-columns: repeat(2, 1fr);">
      <div class="r-card">
        <div class="r-card-label">Factures en brouillon</div>
        <div class="r-card-value">${c.engagements.draftInvoiceCount}</div>
        <div class="r-card-sub">${fmt(c.engagements.draftInvoiceValue)} XAF potentiel</div>
      </div>
      <div class="r-card">
        <div class="r-card-label">Proformas ouverts</div>
        <div class="r-card-value">${c.engagements.openProformaCount}</div>
        <div class="r-card-sub">${fmt(c.engagements.openProformaValue)} XAF potentiel</div>
      </div>
    </div>
    ${sectionTitle("Qui doit - créances par partie")}
    <table class="r-table">
      <thead><tr><th>Partie</th><th class="r">Principal dû</th><th class="r">Pénalités dues</th><th class="r">Total dû</th><th class="r">En retard</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function renderDashboardReportHtml(data: DashboardReportData): string {
  const sections: string[] = [];
  if (data.global) sections.push(renderGlobal(data.global));
  if (data.dashboard) sections.push(renderDashboardCharts(data.dashboard));
  if (data.clients) sections.push(renderKpiTable("Clients", data.clients));
  if (data.referrers) sections.push(renderKpiTable("Référents", data.referrers));
  if (data.employes) sections.push(renderKpiTable("Employés", data.employes));
  if (data.services) sections.push(renderServices(data.services));
  if (data.creances) sections.push(renderCreances(data.creances));

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #fff; }
  #report {
    font-family: 'Trebuchet MS', 'Calibri', sans-serif;
    font-size: 11px; color: #222; max-width: 748px; margin: 0 auto;
    padding: 36px 52px 44px;
  }
  .r-brand { display: flex; align-items: flex-end; gap: 18px; margin-bottom: 10px; }
  .r-brand img { height: 64px; width: auto; object-fit: contain; }
  .r-tagline { font-style: italic; font-size: 11px; color: #888; }
  .r-rule { border: none; border-top: 1px solid #333; margin: 12px 0 24px; }
  .r-title { text-align: center; font-size: 18px; font-weight: 700; letter-spacing: 4px; margin-bottom: 6px; text-transform: uppercase; }
  .r-meta { text-align: center; font-size: 11px; color: #666; margin-bottom: 28px; }
  .r-section-title { font-size: 12.5px; font-weight: 700; color: #2a1f00; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; page-break-after: avoid; }
  table.r-table { width: 100%; border-collapse: collapse; font-size: 11px; page-break-inside: avoid; }
  table.r-table thead tr { background: #ddc99a; }
  table.r-table thead th { padding: 5px 9px; font-size: 10.5px; font-weight: 600; text-align: left; color: #2a1f00; border: 1px solid #c9ae72; }
  table.r-table thead th.r { text-align: right; }
  table.r-table tbody td { padding: 6px 9px; border: 1px solid #eae6de; }
  table.r-table tbody td.r { text-align: right; }
  table.r-table tbody td.r-empty { text-align: center; color: #999; padding: 14px; }
  table.r-table tfoot td { padding: 6px 9px; font-weight: 700; background: #f7f1e3; border: 1px solid #c9ae72; }
  table.r-table tfoot td.r { text-align: right; }
  .r-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; page-break-inside: avoid; }
  .r-card { border: 1px solid #e5e0d5; border-radius: 4px; padding: 10px 12px; }
  .r-card-label { font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #888; margin-bottom: 4px; }
  .r-card-value { font-size: 15px; font-weight: 700; color: #222; }
  .r-card-value.warn { color: #b03a2e; }
  .r-card-value.good { color: #1a7a4c; }
  .r-card-sub { font-size: 9.5px; color: #999; margin-top: 2px; }
  .r-chart { border: 1px solid #e5e5e5; border-radius: 4px; margin: 10px 0 14px; padding: 8px; page-break-inside: avoid; }
  .r-chart svg { display: block; width: 100%; height: auto; }
  .r-footer { padding-top: 28px; margin-top: 28px; border-top: 1px solid #eee; text-align: center; font-size: 9.5px; color: #a77800; line-height: 1.8; }
</style>
</head>
<body>
  <div id="report">
    <div class="r-brand">
      <img src="${data.logoBase64}" alt="Le Prestigieux" />
      <div class="r-tagline">Une autre idée du voyage</div>
    </div>
    <hr class="r-rule" />
    <div class="r-title">Rapport</div>
    <div class="r-meta">
      Période du ${esc(data.from)} au ${esc(data.to)} · Base : ${esc(data.basisLabel)} · Généré le ${esc(data.generatedAt)}
    </div>

    ${sections.join("\n")}

    <div class="r-footer">
      LE PRESTIGIEUX, Capital de 1 000 000 FCFA · N°RCCM : GA-LBV-01-2021-A10-00554 · NIF : 393325T<br/>
      N°COMPTE : 22591300201 ORABANK · Siège social : Centre-Ville, Galerie Hollando Bureau 06
    </div>
  </div>
</body>
</html>`;
}
