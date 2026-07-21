import { Loader2 } from "lucide-react";
import { type KpiRow } from "@/lib/reporting.api";
import { KpiTable } from "../dashboard/KpiTable";
import { ChartCanvas, CHART_COLORS } from "@/components/analytics/ChartCanvas";
import { useClientKpis } from "@/hooks/queries/useClientKpis";
import { useApporteurKpis } from "@/hooks/queries/useApporteurKpis";

interface ClientsReferrersTabProps {
  from: string;
  to: string;
  basis: "accrual" | "cash";
}

function ComparisonChart({ label, rows, color }: { label: string; rows: KpiRow[]; color: string }) {
  const top = rows.slice(0, 10);
  if (top.length === 0) {
    return <p className="text-[11.5px] text-neutral-500 text-center py-12">Aucune donnée sur cette période.</p>;
  }
  return (
    <ChartCanvas
      label={label}
      height={Math.max(180, top.length * 34)}
      config={{
        type: "bar",
        data: {
          labels: top.map((r) => r.name),
          datasets: [{ label: "Valeur (XAF)", data: top.map((r) => r.value), backgroundColor: color, borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 11 }, color: CHART_COLORS.muted }, grid: { color: CHART_COLORS.grid }, beginAtZero: true },
            y: { ticks: { font: { size: 11 }, color: CHART_COLORS.muted }, grid: { display: false } },
          },
        },
      }}
    />
  );
}

// Directly resolves the "compare party data" need that started this whole
// section — one sortable table per role instead of navigating one party page
// at a time. Each row still links through to that party's own detail page
// for the real drill-down (transaction history, balances), rather than
// duplicating that content here.
export function ClientsReferrersTab({ from, to, basis }: ClientsReferrersTabProps) {
  const { data: clients = [], isLoading: loadingClients } = useClientKpis({ from, to, basis });
  const { data: referrers = [], isLoading: loadingReferrers } = useApporteurKpis({ from, to, basis });
  const loading = loadingClients || loadingReferrers;

  if (loading) {
    return (
      <div className="text-center py-16 text-neutral-400">
        <Loader2 size={18} className="animate-spin inline mr-2" /> Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">Comparaison — valeur par client</p>
        <p className="text-[10.5px] text-neutral-500 mb-3">
          Total facturé (factures émises), sur la période sélectionnée.
        </p>
        <ComparisonChart label="Comparaison valeur par client" rows={clients} color={CHART_COLORS.primary} />
      </div>
      <KpiTable title="Clients" rows={clients} linkTo={(id) => `/parties/${id}`} />

      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">Comparaison — valeur par référent</p>
        <p className="text-[10.5px] text-neutral-500 mb-3">
          Factures référées + commissions apportées, sur la période sélectionnée.
        </p>
        <ComparisonChart label="Comparaison valeur par référent" rows={referrers} color={CHART_COLORS.success} />
      </div>
      <KpiTable title="Référents" rows={referrers} linkTo={(id) => `/parties/${id}`} />
    </div>
  );
}
