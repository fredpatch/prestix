// Purpose-built for the dashboard quick-view report — deliberately NOT
// reusing invoice-print.template.ts. That template is shaped around a single
// document with one items table; this is a set of summary sections (CA
// composition, overdue/unpaid, stock, épargne). Forcing one into the other's
// shape would have made both worse. Same branding conventions kept
// consistent though: same logo, same footer, same fonts/colors.

export interface DashboardReportData {
  logoBase64: string;
  from: string; // already formatted, e.g. "15 juin 26"
  to: string;
  basisLabel: string; // "Engagement" | "Encaissement"
  generatedAt: string;
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

function fmt(v = 0): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

function esc(v: string | undefined): string {
  if (!v) return "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderDashboardReportHtml(data: DashboardReportData): string {
  const rows = data.caComposition
    .map(
      (b) => `
    <tr>
      <td>${esc(b.label)}</td>
      <td class="r">${fmt(b.gross)}</td>
      <td class="r">${fmt(b.gain)}</td>
    </tr>`,
    )
    .join("");

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
  .r-section-title { font-size: 12.5px; font-weight: 700; color: #2a1f00; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  table.r-ca { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.r-ca thead tr { background: #ddc99a; }
  table.r-ca thead th { padding: 5px 9px; font-size: 10.5px; font-weight: 600; text-align: left; color: #2a1f00; border: 1px solid #c9ae72; }
  table.r-ca thead th.r { text-align: right; }
  table.r-ca tbody td { padding: 6px 9px; border: 1px solid #eae6de; }
  table.r-ca tbody td.r { text-align: right; }
  table.r-ca tfoot td { padding: 6px 9px; font-weight: 700; background: #f7f1e3; border: 1px solid #c9ae72; }
  table.r-ca tfoot td.r { text-align: right; }
  .r-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .r-card { border: 1px solid #e5e0d5; border-radius: 4px; padding: 10px 12px; }
  .r-card-label { font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #888; margin-bottom: 4px; }
  .r-card-value { font-size: 15px; font-weight: 700; color: #222; }
  .r-card-value.warn { color: #b03a2e; }
  .r-card-value.good { color: #1a7a4c; }
  .r-card-sub { font-size: 9.5px; color: #999; margin-top: 2px; }
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
    <div class="r-title">Rapport rapide</div>
    <div class="r-meta">
      Période du ${esc(data.from)} au ${esc(data.to)} · Base : ${esc(data.basisLabel)} · Généré le ${esc(data.generatedAt)}
    </div>

    <div class="r-section-title">Composition du CA</div>
    <table class="r-ca">
      <thead>
        <tr><th>Bucket</th><th class="r">CA Brut (XAF)</th><th class="r">Gain (XAF)</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td>TOTAL</td><td class="r">${fmt(data.totalGross)}</td><td class="r">${fmt(data.totalGain)}</td></tr>
      </tfoot>
    </table>

    <div class="r-section-title">Indicateurs clés</div>
    <div class="r-cards">
      <div class="r-card">
        <div class="r-card-label">En retard</div>
        <div class="r-card-value warn">${fmt(data.overdueAmount)} XAF</div>
        <div class="r-card-sub">${data.overdueCount} échéance(s)</div>
      </div>
      <div class="r-card">
        <div class="r-card-label">Impayées (toutes)</div>
        <div class="r-card-value warn">${fmt(data.unpaidAmount)} XAF</div>
        <div class="r-card-sub">${data.unpaidCount} échéance(s)</div>
      </div>
      <div class="r-card">
        <div class="r-card-label">Stock bas</div>
        <div class="r-card-value">${data.lowStockCount}</div>
        <div class="r-card-sub">article(s) sous seuil</div>
      </div>
      <div class="r-card">
        <div class="r-card-label">Épargne — solde net période</div>
        <div class="r-card-value ${data.epargneNetChange >= 0 ? "good" : "warn"}">${fmt(data.epargneNetChange)} XAF</div>
        <div class="r-card-sub">Métrique globale, pas un solde client</div>
      </div>
    </div>

    <div class="r-footer">
      LE PRESTIGIEUX, Capital de 1 000 000 FCFA · N°RCCM : GA-LBV-01-2021-A10-00554 · NIF : 393325T<br/>
      N°COMPTE : 22591300201 ORABANK · Siège social : Centre-Ville, Galerie Hollando Bureau 06
    </div>
  </div>
</body>
</html>`;
}
