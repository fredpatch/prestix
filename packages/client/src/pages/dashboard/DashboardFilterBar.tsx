import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportingApi } from "@/lib/reporting.api";
import { PRESETS } from "./date-presets";

interface DashboardFilterBarProps {
  from: string;
  to: string;
  basis: "accrual" | "cash";
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onBasisChange: (basis: "accrual" | "cash") => void;
  showExports?: boolean; // on by default (Dashboard keeps its quick-export buttons); Analyse turns this off — real exports live in the Rapports tab there, where module selection actually matches the active tab
}

// Date range + basis - shared by every section below, per spec:
// "consistent from/to across all sections"
export function DashboardFilterBar({
  from,
  to,
  basis,
  onFromChange,
  onToChange,
  onBasisChange,
  showExports = true,
}: DashboardFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {PRESETS.map((p) => (
        <Button
          key={p.label}
          variant={from === p.from && to === p.to ? "default" : "outline"}
          onClick={() => {
            onFromChange(p.from);
            onToChange(p.to);
          }}
        >
          {p.label}
        </Button>
      ))}
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="h-9 rounded border border-neutral-200 bg-white px-2 text-[12px]"
      />
      <span className="text-[11px] text-neutral-400">→</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="h-9 rounded border border-neutral-200 bg-white px-2 text-[12px]"
      />

      <div className="grid grid-cols-2 rounded-lg border border-neutral-200 overflow-hidden ml-2">
        <button
          type="button"
          onClick={() => onBasisChange("accrual")}
          className={`px-3 py-1.5 text-[11.5px] font-medium ${basis === "accrual" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
          title="Compte les ventes au moment où elles sont conclues (facture émise, commission enregistrée)"
        >
          Engagement
        </button>
        <button
          type="button"
          onClick={() => onBasisChange("cash")}
          className={`px-3 py-1.5 text-[11.5px] font-medium ${basis === "cash" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
          title="Compte l'argent au moment où il est réellement reçu"
        >
          Encaissement
        </button>
      </div>

      {showExports && (
        <div className="ml-auto flex gap-2">
          <a
            href={reportingApi.exportPdfUrl({ from, to, basis })}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <FileText size={13} /> Rapport rapide (PDF)
          </a>
          <a
            href={reportingApi.exportExcelUrl({ from, to, basis })}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Download size={13} /> Export Excel
          </a>
        </div>
      )}
    </div>
  );
}
