import { Loader2 } from "lucide-react";
import { EmployeeKpiTable } from "../dashboard/EmployeeKpiTable";
import { ChartCanvas, CHART_COLORS } from "@/components/analytics/ChartCanvas";
import { useEmployeeKpis } from "@/hooks/queries/useEmployeeKpis";

interface EmployeesTabProps {
  from: string;
  to: string;
  basis: "accrual" | "cash";
}

export function EmployeesTab({ from, to, basis }: EmployeesTabProps) {
  const { data: rows = [], isLoading } = useEmployeeKpis({ from, to, basis });

  if (isLoading) {
    return (
      <div className="text-center py-16 text-subtle">
        <Loader2 size={18} className="animate-spin inline mr-2" /> Chargement...
      </div>
    );
  }

  const top = rows.slice(0, 10);

  return (
    <div>
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <p className="text-[11.5px] font-semibold text-body mb-0.5">
          Comparaison — valeur générée par employé
        </p>
        <p className="text-[10.5px] text-muted-foreground mb-3">
          Factures créées + commissions enregistrées, sur la période sélectionnée.
        </p>
        {top.length === 0 ? (
          <p className="text-[11.5px] text-muted-foreground text-center py-12">Aucune donnée sur cette période.</p>
        ) : (
          <ChartCanvas
            label="Comparaison valeur par employé"
            height={Math.max(180, top.length * 34)}
            config={{
              type: "bar",
              data: {
                labels: top.map((r) => r.name),
                datasets: [
                  {
                    label: "Valeur (XAF)",
                    data: top.map((r) => r.value),
                    backgroundColor: CHART_COLORS.primary,
                    borderRadius: 4,
                  },
                ],
              },
              options: {
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    ticks: { font: { size: 11 }, color: CHART_COLORS.muted },
                    grid: { color: CHART_COLORS.grid },
                    beginAtZero: true,
                  },
                  y: { ticks: { font: { size: 11 }, color: CHART_COLORS.muted }, grid: { display: false } },
                },
              },
            }}
          />
        )}
      </div>

      <EmployeeKpiTable rows={rows} from={from} to={to} basis={basis} />
    </div>
  );
}
