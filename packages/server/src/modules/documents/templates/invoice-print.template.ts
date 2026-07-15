// Ported from legacy PrintableCommercialDocument (React) — server-side HTML string version.
// Trimmed for Sprint 0 pre-flight: no installment schedule, no multi-passenger row split
// (both depend on M5 data models, not yet built). Restore when M4/M5 land in Sprint 3-4.

export interface PrintLineItem {
  clientName: string;
  category: string;
  detail?: string;
  date?: string;
  returnDate?: string;
  cie?: string;
  travelClass?: string;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface PrintInvoiceData {
  docType: "proforma" | "invoice" | "delivery_note";
  docNumber: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string; // proforma only — 48h expiry, already formatted
  paymentMode: string;
  agentName?: string;
  buyerName: string;
  buyerPhone?: string;
  logoBase64: string; // data URI, e.g. "data:image/jpeg;base64,..."
  items: PrintLineItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paidAmount?: number;
  balanceDue?: number;
  receivedOn?: string; // formatted date, or blank for signature line
  installments?: Array<{
    sequence: number;
    dueDate: string;
    expectedAmount: number;
    paidAmount: number;
    status: "unpaid" | "partial" | "paid";
  }>;
}

const DOCTYPE_LABELS: Record<string, string> = {
  proforma: "PROFORMA",
  invoice: "FACTURE",
  delivery_note: "BON DE LIVRAISON",
};

const AMOUNT_WORDS_LABEL: Record<string, string> = {
  proforma: "Proforma arrêtée à la somme de",
  invoice: "Facture arrêtée à la somme de",
  delivery_note: "Bon de livraison arrêté à la somme de",
};

function fmt(v = 0): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

// ── French amount-in-words (ported verbatim from legacy — proven oracle) ──
const ONES = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];
const TENS = [
  "",
  "",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante-dix",
  "quatre-vingt",
  "quatre-vingt-dix",
];

function below100(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10),
    u = n % 10;
  if (t === 7) return "soixante-" + ONES[10 + u];
  if (t === 9) return "quatre-vingt-" + (u ? ONES[u] : "");
  if (t === 8) return "quatre-vingt" + (u ? "-" + ONES[u] : "s");
  return TENS[t] + (u ? "-" + ONES[u] : "");
}

function below1000(n: number): string {
  const h = Math.floor(n / 100),
    r = n % 100;
  const hStr = h === 1 ? "cent" : h > 1 ? ONES[h] + " cent" + (r === 0 ? "s" : "") : "";
  const rStr = r > 0 ? below100(r) : "";
  return [hStr, rStr].filter(Boolean).join(" ");
}

function amountWords(n: number): string {
  if (n === 0) return "zéro franc CFA";
  const parts: string[] = [];
  if (n >= 1_000_000) {
    const m = Math.floor(n / 1_000_000);
    parts.push((m === 1 ? "un" : below1000(m)) + " million" + (m > 1 ? "s" : ""));
    n %= 1_000_000;
  }
  if (n >= 1_000) {
    const k = Math.floor(n / 1_000);
    parts.push(k === 1 ? "mille" : below1000(k) + " mille");
    n %= 1_000;
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(" ").trim() + " franc CFA";
}

function esc(v: string | undefined): string {
  if (!v) return "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderInvoiceHtml(doc: PrintInvoiceData): string {
  const title = DOCTYPE_LABELS[doc.docType] ?? "DOCUMENT";
  const showPaymentRecap = doc.docType === "invoice";
  const words = doc.total > 0 ? amountWords(Math.round(doc.total)).toUpperCase() : null;
  const showCie = doc.items.some((l) => l.cie);
  const showClass = doc.items.some((l) => l.travelClass);
  const showLineDiscount = doc.items.some((l) => (l.discount ?? 0) > 0);
  const showInstallments = doc.docType === "invoice" && (doc.installments?.length ?? 0) > 1;

  const INSTALLMENT_STATUS_LABELS: Record<string, string> = {
    unpaid: "Non payée",
    partial: "Partielle",
    paid: "Payée",
  };

  const scheduleRows = (doc.installments ?? [])
    .map(
      (inst) => `
    <tr>
      <td>Échéance ${inst.sequence}</td>
      <td>${esc(inst.dueDate)}</td>
      <td class="r">${fmt(inst.expectedAmount)}</td>
      <td class="r">${fmt(inst.paidAmount)}</td>
      <td class="r">${fmt(Math.max(0, inst.expectedAmount - inst.paidAmount))}</td>
      <td>${INSTALLMENT_STATUS_LABELS[inst.status] ?? inst.status}</td>
    </tr>`,
    )
    .join("");

  const rows = doc.items
    .map(
      (l, i) => `
    <tr>
      <td>${esc(l.clientName)}</td>
      <td class="c">${i + 1}</td>
      <td>
        <div class="svc-category">${esc(l.category)}</div>
        ${l.detail ? `<div class="svc-detail">${esc(l.detail)}</div>` : ""}
      </td>
       <td>${esc(l.date) || "-"}${l.returnDate ? `<br/><span class="dim" style="font-size:9px;">retour ${esc(l.returnDate)}</span>` : ""}</td>
      ${showCie ? `<td class="c">${esc(l.cie) || '<span class="dim">-</span>'}</td>` : ""}
      ${showClass ? `<td class="c">${esc(l.travelClass) || '<span class="dim">-</span>'}</td>` : ""}
      <td class="r">${fmt(l.unitPrice)}</td>
      ${showLineDiscount ? `<td class="r">${(l.discount ?? 0) > 0 ? `- ${fmt(l.discount)}` : "—"}</td>` : ""}
      <td class="r">${fmt(l.total)}</td>
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
  #printable-doc {
    font-family: 'Trebuchet MS', 'Calibri', sans-serif;
    font-size: 11px; color: #222; max-width: 748px; margin: 0 auto;
    padding: 36px 52px 44px; line-height: 1.5; position: relative;
  }
  .p-brand { display: flex; align-items: flex-end; gap: 18px; margin-bottom: 10px; }
  .p-brand img { height: 72px; width: auto; object-fit: contain; }
  .p-tagline { font-style: italic; font-size: 11px; color: #888; margin-bottom: 2px; }
  .p-agent-line { font-size: 11.5px; color: #444; }
  .p-agent-line .lbl { font-weight: 600; color: #333; }
  .p-rule { border: none; border-top: 1px solid #333; margin: 12px 0 32px; }
  .p-title { text-align: center; font-size: 20px; font-weight: 700; letter-spacing: 6px; margin-bottom: 36px; text-transform: uppercase; }
  .p-info { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px; margin-bottom: 36px; }
  .p-to-label { font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; margin-bottom: 6px; }
  .p-to-name { font-size: 17.5px; font-weight: 600; color: #111; margin-bottom: 3px; }
  .p-to-phone { font-size: 11.5px; color: #666; }
  .p-meta table { border-collapse: collapse; font-size: 11.5px; }
  .p-meta td { padding: 3px 5px; white-space: nowrap; }
  .p-meta td.mk { font-weight: 600; color: #555; padding-right: 10px; }
  table.p-items { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px; }
  table.p-items thead tr { background: #ddc99a; }
  table.p-items thead th { padding: 4px 7px; font-size: 10px; font-weight: 500; text-align: left; color: #2a1f00; border: 1px solid #c9ae72; }
  table.p-items thead th.r { text-align: right; }
  table.p-items thead th.c { text-align: center; }
  table.p-items tbody tr { border-bottom: 1px solid #eae6de; }
  table.p-items tbody td { padding: 7px 7px;  font-size: 10px; border-left: 1px solid #eae6de; border-right: 1px solid #eae6de; }
  table.p-items tbody td.r { text-align: right; }
  table.p-items tbody td.c { text-align: center; }
  table.p-items tbody td.dim { color: #aaa; font-size: 11px; }
  .svc-category { font-weight: 600; font-size: 11.5px; }
  .svc-detail { font-size: 10.5px; color: #666; font-style: italic; margin-top: 1px; }
  .p-totals-row { display: flex; justify-content: flex-end; margin-top: 32px; margin-bottom: 32px; }
  .p-totals-box { border: 1px solid #aaa; min-width: 210px; }
  .p-totals-box table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  .p-totals-box table td { padding: 4px 11px; }
  .p-totals-box table td.tl { font-weight: 600; color: #444; border-right: 1px solid #aaa; white-space: nowrap; }
  .p-totals-box table td.tr { text-align: right; }
  .p-totals-box table tr + tr td { border-top: 1px solid #ddd; }
  .p-totals-box table tr.t-main td { font-size: 12px; font-weight: 600; background: #f7f1e3; }
  .p-totals-box table tr.t-paid td { color: #1a5c35; }
  .p-totals-box table tr.t-balance td { color: #8b1a1a; font-weight: 600; }
  .p-schedule { margin-top: 8px; margin-bottom: 12px; }
  .p-schedule-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 4px; }
  table.p-schedule-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  table.p-schedule-table thead th { background: #f5f0e8; padding: 3px 6px; font-size: 9.5px; font-weight: 600; color: #444; border: 1px solid #ddd; text-align: left; }
  table.p-schedule-table thead th.r { text-align: right; }
  table.p-schedule-table tbody td { padding: 3px 6px; border: 1px solid #eee; }
  table.p-schedule-table tbody td.r { text-align: right; }
  .p-words { font-size: 11px; margin-bottom: 10px; padding-top: 30px; font-style: italic; }
  .p-words strong { font-style: normal; font-weight: 600; color: #222; }
  .p-received { font-size: 11px; color: #555; margin-bottom: 28px; }
  .p-received .lbl { font-weight: 600; color: #333; }
  .p-sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; margin-top: 48px; margin-bottom: 24px; }
  .p-sig { border-top: 1px solid #bbb; padding-top: 8px; font-size: 10px; color: #aaa; text-align: center; min-height: 54px; }
  .p-footer { padding-top: 28px; text-align: center; font-size: 9.5px; color: #a77800; line-height: 1.8; }
</style>
</head>
<body>
  <div id="printable-doc">
    <div class="p-brand">
      <img src="${doc.logoBase64}" alt="Le Prestigieux" />
      <div>
        <div class="p-tagline">Une autre idée du voyage</div>
        ${doc.agentName ? `<div class="p-agent-line"><span class="lbl">Agent :</span> ${esc(doc.agentName)}</div>` : ""}
      </div>
    </div>
    <hr class="p-rule" />
    <div class="p-title">${title}</div>
    <div class="p-info">
      <div class="p-to">
        <div class="p-to-label">A</div>
        <div class="p-to-name">${esc(doc.buyerName)}</div>
        ${doc.buyerPhone ? `<div class="p-to-phone">Tél : ${esc(doc.buyerPhone)}</div>` : ""}
      </div>
      <div class="p-meta">
        <table>
          <tr><td class="mk">${title === "FACTURE" ? "Facture #" : title === "PROFORMA" ? "Proforma #" : "BL #"} :</td><td>${esc(doc.docNumber)}</td></tr>
          <tr><td class="mk">Date :</td><td>${esc(doc.issueDate)}</td></tr>
          <tr><td class="mk">Échéance :</td><td>${esc(doc.dueDate) || "-"}</td></tr>
          <tr><td class="mk">Mode paiement :</td><td>${esc(doc.paymentMode)}</td></tr>
        </table>
      </div>
    </div>
    <table class="p-items">
      <thead>
        <tr>
          <th style="width:14%">Client</th>
          <th class="c" style="width:6%">#</th>
          <th>Service</th>
          <th style="width:11%">Date</th>
          ${showCie ? '<th class="c" style="width:7%">CIE</th>' : ""}
          ${showClass ? '<th class="c" style="width:7%">Classe</th>' : ""}
          <th class="r" style="width:13%">Prix unitaire</th>
          ${showLineDiscount ? '<th class="r" style="width:9%">Remise</th>' : ""}
          <th class="r" style="width:11%">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="p-totals-row">
      <div class="p-totals-box">
        <table>
          ${
            (doc.discount ?? 0) > 0
              ? `
          <tr><td class="tl">Sous-total</td><td class="tr">${fmt(doc.subtotal)}</td></tr>
          <tr><td class="tl">Remise</td><td class="tr">- ${fmt(doc.discount)}</td></tr>`
              : ""
          }
          <tr class="t-main"><td class="tl">TOTAL</td><td class="tr">${fmt(doc.total)}</td></tr>
          ${
            showPaymentRecap
              ? `
          <tr class="t-paid"><td class="tl">Avance</td><td class="tr">${fmt(doc.paidAmount ?? 0)}</td></tr>
          <tr class="t-balance"><td class="tl">Reste à payer</td><td class="tr">${fmt(doc.balanceDue ?? 0)}</td></tr>`
              : ""
          }
        </table>
      </div>
    </div>

        ${
          showInstallments
            ? `<div class="p-schedule">
             <div class="p-schedule-title">Échéancier de paiement</div>
             <table class="p-schedule-table">
               <thead>
                 <tr><th>Échéance</th><th>Date prévue</th><th class="r">Montant prévu</th><th class="r">Montant payé</th><th class="r">Reste</th><th>Statut</th></tr>
               </thead>
               <tbody>${scheduleRows}</tbody>
             </table>
           </div>`
            : ""
        }

   ${words ? `<div class="p-words"><strong>${AMOUNT_WORDS_LABEL[doc.docType]}</strong> ${words}</div>` : ""}
    <div class="p-received"><span class="lbl">Reçu le</span> ${esc(doc.receivedOn) || '<span style="display:inline-block;min-width:120px;border-bottom:1px solid #bbb;">&nbsp;</span>'}</div>
    <div class="p-sigs">
      <div class="p-sig">Signature destinataire</div>
      <div class="p-sig">Signature émetteur</div>
    </div>

       ${
         doc.docType === "proforma" && doc.validUntil
           ? `<div style="font-size:10px;color:#7a5c00;background:#fef9ec;border:1px solid #e8d48a;border-radius:3px;padding:4px 10px;margin-top:16px;font-style:italic;">
             Attention : cette proforma est valable <strong>48h</strong> à compter de sa date d'émission - jusqu'au <strong>${esc(doc.validUntil)}</strong>.
           </div>`
           : ""
       }

    <div class="p-footer">
      LE PRESTIGIEUX, Capital de 1 000 000 FCFA · N°RCCM : GA-LBV-01-2021-A10-00554 · NIF : 393325T<br/>
      N°COMPTE : 22591300201 ORABANK · Siège social : Centre-Ville, Galerie Hollando Bureau 06
    </div>
  </div>
</body>
</html>`;
}
