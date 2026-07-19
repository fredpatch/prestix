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
// exactly what to include, matching SICOT's own "Rapports" pattern. PDF stays
// the fixed quick-summary (same shape as the Dashboard's own PDF button —
// extending it to conditionally include arbitrary sections would mean real
// template rework, deliberately not attempted in this pass); Excel gets the
// real module selection, since its multi-sheet shape suits that naturally.
export function RapportsTab({ from, to, basis }: RapportsTabProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>(MODULES.map((m) => m.key));

  function toggleModule(key: string) {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    );
  }

  const excelUrl = reportingApi.exportExcelUrl({ from, to, basis }, selectedModules);
  const pdfUrl = reportingApi.exportPdfUrl({ from, to, basis });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">
          Générer un rapport Excel
        </p>
        <p className="text-[10.5px] text-neutral-500 mb-3">
          Choisissez les sections à inclure — chaque section devient une ou plusieurs feuilles dans
          le fichier généré, pour la période et la base sélectionnées en haut de page.
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
          {MODULES.map((m) => (
            <label
              key={m.key}
              className="flex items-center gap-1.5 text-[12px] text-neutral-800 cursor-pointer"
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

        <a
          href={selectedModules.length > 0 ? excelUrl : undefined}
          className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-medium ${
            selectedModules.length > 0
              ? "bg-brand-gold-dark text-white hover:opacity-90"
              : "bg-neutral-200 text-neutral-400 cursor-not-allowed pointer-events-none"
          }`}
        >
          <FileDown size={13} /> Générer et télécharger (Excel)
        </a>
        {selectedModules.length === 0 && (
          <p className="text-[10.5px] text-red-600 mt-1.5">Sélectionnez au moins une section.</p>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">Rapport rapide (PDF)</p>
        <p className="text-[10.5px] text-neutral-500 mb-3">
          Résumé fixe (composition CA + indicateurs clés), avec logo et mise en forme — même contenu
          que le bouton du Tableau de bord.
        </p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <FileText size={13} /> Ouvrir le PDF
        </a>
      </div>

      <p className="text-[10.5px] text-neutral-400">
        Historique des rapports générés et génération automatique périodique : prévus pour une passe
        ultérieure, pas encore construits.
      </p>
    </div>
  );
}
