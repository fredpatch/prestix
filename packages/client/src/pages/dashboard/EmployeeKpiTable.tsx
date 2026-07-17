import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { EmployeeKpiRow } from "@/lib/reporting.api";
import { fmt } from "./format";

interface EmployeeKpiTableProps {
  rows: EmployeeKpiRow[];
  from: string;
  to: string;
  basis: "accrual" | "cash";
}

// Separate from the generic KpiTable (used by Client/Apporteur) on purpose —
// Employé is the one role with a real per-activity-type breakdown and a
// drill-down link, per Lucrèce's own framing ("volume d'action... dépendamment
// des différentes activités"). Leaking that into the shared component would
// have made Client/Apporteur's simpler shape more complicated for no reason.
function breakdownSummary(b: EmployeeKpiRow["breakdown"]): string {
  const parts: string[] = [];
  if (b.invoicesIssued > 0) parts.push(`${b.invoicesIssued} facture${b.invoicesIssued > 1 ? "s" : ""}`);
  if (b.paymentsRecorded > 0) parts.push(`${b.paymentsRecorded} paiement${b.paymentsRecorded > 1 ? "s" : ""}`);
  if (b.commissionsLogged > 0) parts.push(`${b.commissionsLogged} commission${b.commissionsLogged > 1 ? "s" : ""}`);
  if (b.stockMovements > 0) parts.push(`${b.stockMovements} mvt stock`);
  if (b.savingsTransactions > 0) parts.push(`${b.savingsTransactions} épargne`);
  return parts.length > 0 ? parts.join(" · ") : "Aucune activité";
}

export function EmployeeKpiTable({ rows, from, to, basis }: EmployeeKpiTableProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-neutral-200">
        <p className="text-[11.5px] font-semibold text-neutral-800">KPI Employé</p>
      </div>
      <table className="w-full text-left">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
              Nom
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
              Valeur (XAF)
            </th>
            <th className="px-4 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((r) => (
            <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
              <td className="px-4 py-2">
                <p className="text-[12px] text-neutral-800">{r.name}</p>
                <p className="text-[10px] text-neutral-500">{breakdownSummary(r.breakdown)}</p>
              </td>
              <td className="px-4 py-2 text-[12px] font-medium text-neutral-800 text-right align-top">
                {fmt(r.value)}
              </td>
              <td className="px-4 py-2 text-right align-top">
                <Link
                  to={`/reporting/employees/${r.id}?from=${from}&to=${to}&basis=${basis}`}
                  className="inline-flex items-center text-neutral-400 hover:text-brand-gold-dark"
                  title="Voir détail"
                >
                  <ChevronRight size={14} />
                </Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-[11.5px] text-neutral-500">
                Aucune donnée pour cette période.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
