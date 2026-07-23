import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { EmployeeKpiRow } from "@/lib/reporting.api";
import { fmt } from "./format";

interface TopEmployeesPanelProps {
  rows: EmployeeKpiRow[];
  from: string;
  to: string;
  basis: "accrual" | "cash";
}

function breakdownSummary(b: EmployeeKpiRow["breakdown"]): string {
  const parts: string[] = [];
  if (b.invoicesIssued > 0) parts.push(`${b.invoicesIssued} fact.`);
  if (b.paymentsRecorded > 0) parts.push(`${b.paymentsRecorded} paiem.`);
  if (b.commissionsLogged > 0) parts.push(`${b.commissionsLogged} comm.`);
  if (b.stockMovements > 0) parts.push(`${b.stockMovements} stock`);
  if (b.savingsTransactions > 0) parts.push(`${b.savingsTransactions} épargne`);
  return parts.length > 0 ? parts.join(" · ") : "Aucune activité";
}

export function TopEmployeesPanel({ rows, from, to, basis }: TopEmployeesPanelProps) {
  const topRows = rows.slice(0, 5);

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[13px] font-semibold text-foreground">Top employés</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Valeur et volume d'activité.</p>
      </div>
      <div className="divide-y divide-neutral-100">
        {topRows.map((row, index) => (
          <Link
            key={row.id}
            to={`/reporting/employees/${row.id}?from=${from}&to=${to}&basis=${basis}`}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-muted"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-[11px] font-bold text-body">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-body">{row.name}</p>
                <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                  {breakdownSummary(row.breakdown)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-right text-[12px] font-bold tabular-nums text-foreground">
                {fmt(row.value)}
              </p>
              <ChevronRight size={13} className="text-subtle" />
            </div>
          </Link>
        ))}
        {topRows.length === 0 && (
          <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
            Aucune donnée sur la période.
          </p>
        )}
      </div>
    </section>
  );
}
