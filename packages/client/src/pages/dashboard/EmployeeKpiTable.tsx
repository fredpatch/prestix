import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { EmployeeKpiRow } from "@/lib/reporting.api";
import { fmt } from "./format";
import { ReadOnlyTable } from "@/components/ui/read-only-table";

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
  const columns: ColumnDef<EmployeeKpiRow, any>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <>
          <p className="text-[12px] text-body">{row.original.name}</p>
          <p className="text-[10px] text-muted-foreground">{breakdownSummary(row.original.breakdown)}</p>
        </>
      ),
    },
    {
      accessorKey: "value",
      header: "Valeur (XAF)",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="font-medium text-body align-top">{fmt(row.original.value)}</span>
      ),
    },
    {
      id: "link",
      header: "",
      meta: { align: "right" },
      cell: ({ row }) => (
        <Link
          to={`/reporting/employees/${row.original.id}?from=${from}&to=${to}&basis=${basis}`}
          className="inline-flex items-center text-subtle hover:text-brand-gold-dark align-top"
          title="Voir détail"
        >
          <ChevronRight size={14} />
        </Link>
      ),
    },
  ];

  return <ReadOnlyTable title="KPI Employé" columns={columns} data={rows} limit={10} />;
}
