import { useState } from "react";
import { FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportingApi } from "@/lib/reporting.api";

interface RapportsTabProps {
  from: string;
  to: string;
  basis: "accrual" | "cash";
}

const MODULES: { key: string; label: string }[] = [
  { key: "global", label: "Vue globale (composition CA + résumé)" },
  { key: "clients_referents", label: "Clients & Référents" },
  { key: "employes", label: "Employés" },
  { key: "services", label: "Services" },
  { key: "creances", label: "Créances & Engagements" },
];

// The direct fix for Fred's real observation: the export buttons elsewhere
// on this page always exported the same fixed "everything" shape regardless
// of which tab was open. This tab is the actual place exports belong — pick
// exactly what to include, matching SICOT's own "Rapports" pattern. Both
// PDF and Excel now honor the same module selection (PDF template was
// reworked to support optional sections, matching Excel's own design).
export function RapportsTab({ from, to, basis }: RapportsTabProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>(MODULES.map((m) => m.key));

  function toggleModule(key: string) {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    );
  }

  const excelUrl = reportingApi.exportExcelUrl({ from, to, basis }, selectedModules);
  const pdfUrl = reportingApi.exportPdfUrl({ from, to, basis }, selectedModules);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-body mb-0.5">Générer un rapport</p>
        <p className="text-[10.5px] text-muted-foreground mb-3">
          Choisissez les sections à inclure — pour la période et la base sélectionnées en haut de
          page. Chaque section devient une feuille en Excel, ou une partie du document en PDF.
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
          {MODULES.map((m) => (
            <label
              key={m.key}
              className="flex items-center gap-1.5 text-[12px] text-body cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedModules.includes(m.key)}
                onChange={() => toggleModule(m.key)}
                className="accent-brand-gold-dark"
              />
              {m.label}
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <a
            href={selectedModules.length > 0 ? excelUrl : undefined}
            className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-medium ${
              selectedModules.length > 0
                ? "bg-brand-gold-dark text-white hover:opacity-90"
                : "bg-surface-subtle text-subtle cursor-not-allowed pointer-events-none"
            }`}
          >
            <FileDown size={13} /> Générer Excel
          </a>
          <a
            href={selectedModules.length > 0 ? pdfUrl : undefined}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border text-[12px] font-medium ${
              selectedModules.length > 0
                ? "border-border bg-card text-body hover:bg-surface-muted"
                : "border-border bg-surface-subtle text-subtle cursor-not-allowed pointer-events-none"
            }`}
          >
            <FileText size={13} /> Générer PDF
          </a>
        </div>
        {selectedModules.length === 0 && (
          <p className="text-[10.5px] text-danger-text mt-1.5">Sélectionnez au moins une section.</p>
        )}
      </div>

      <p className="text-[10.5px] text-subtle">
        Historique des rapports générés et génération automatique périodique : prévus pour une passe
        ultérieure (module de gestion documentaire nécessaire) — V2.
      </p>
    </div>
  );
}
