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
    <div className="mb-6 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant={from === p.from && to === p.to ? "default" : "outline"}
            onClick={() => {
              onFromChange(p.from);
              onToChange(p.to);
            }}
          >
            {p.label}
          </Button>
        ))}
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:w-auto sm:grid-cols-[150px_auto_150px]">
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="h-9 min-w-0 rounded border border-border bg-card px-2 text-[12px]"
          />
          <span className="text-[11px] text-subtle">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="h-9 min-w-0 rounded border border-border bg-card px-2 text-[12px]"
          />
        </div>

        <div className="grid w-full grid-cols-2 overflow-hidden rounded-lg border border-border sm:w-auto">
          <button
            type="button"
            onClick={() => onBasisChange("accrual")}
            className={`px-3 py-1.5 text-[11.5px] font-medium ${basis === "accrual" ? "bg-brand-gold-dark text-white" : "bg-card text-muted-foreground"}`}
            title="Compte les ventes au moment où elles sont conclues (facture émise, commission enregistrée)"
          >
            Engagement
          </button>
          <button
            type="button"
            onClick={() => onBasisChange("cash")}
            className={`px-3 py-1.5 text-[11.5px] font-medium ${basis === "cash" ? "bg-brand-gold-dark text-white" : "bg-card text-muted-foreground"}`}
            title="Compte l'argent au moment où il est réellement reçu"
          >
            Encaissement
          </button>
        </div>
      </div>

      {showExports && (
        <div className="grid grid-cols-2 gap-2 sm:flex lg:justify-end">
          <a
            href={reportingApi.exportPdfUrl({ from, to, basis })}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-center text-[12px] font-medium text-body hover:bg-surface-muted"
          >
            <FileText size={13} /> Rapport rapide (PDF)
          </a>
          <a
            href={reportingApi.exportExcelUrl({ from, to, basis })}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-center text-[12px] font-medium text-body hover:bg-surface-muted"
          >
            <Download size={13} /> Export Excel
          </a>
        </div>
      )}
    </div>
  );
}
