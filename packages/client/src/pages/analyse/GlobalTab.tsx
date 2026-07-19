import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { reportingApi, type DashboardSummary, type CaCompositionResult } from "@/lib/reporting.api";
import { SummaryCards } from "../dashboard/SummaryCards";
import { CaCompositionTable } from "../dashboard/CaCompositionTable";
import { ChartCanvas, CHART_COLORS } from "@/components/analytics/ChartCanvas";

interface GlobalTabProps {
  from: string;
  to: string;
  basis: "accrual" | "cash";
}

function bucketLabel(bucket: string): string {
  // "2026-07" (month) vs "2026-07-14" (day/week) — both already sort
  // correctly as strings, just need a shorter display form.
  if (bucket.length === 7) return new Date(`${bucket}-01`).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  return new Date(bucket).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function GlobalTab({ from, to, basis }: GlobalTabProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [composition, setComposition] = useState<CaCompositionResult | null>(null);
  const [trend, setTrend] = useState<{ bucket: string; gross: number; gain: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { from, to, basis };
    Promise.all([
      reportingApi.getSummary(params),
      reportingApi.getCaComposition(params),
      reportingApi.getCaTrend(params),
    ]).then(([summaryRes, compRes, trendRes]) => {
      setSummary(summaryRes.data);
      setComposition(compRes.data);
      setTrend(trendRes.data);
      setLoading(false);
    });
  }, [from, to, basis]);

  if (loading || !summary || !composition) {
    return (
      <div className="text-center py-16 text-neutral-400">
        <Loader2 size={18} className="animate-spin inline mr-2" /> Chargement...
      </div>
    );
  }

  return (
    <div>
      <SummaryCards summary={summary} />

      <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-6">
        <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">Évolution du CA et du gain</p>
        <p className="text-[10.5px] text-neutral-500 mb-3">
          Granularité adaptée à la période sélectionnée (jour, semaine ou mois).
        </p>
        {trend.length === 0 ? (
          <p className="text-[11.5px] text-neutral-500 text-center py-12">Aucune donnée sur cette période.</p>
        ) : (
          <ChartCanvas
            label="Évolution du CA et du gain"
            config={{
              type: "line",
              data: {
                labels: trend.map((t) => bucketLabel(t.bucket)),
                datasets: [
                  {
                    label: "CA Brut",
                    data: trend.map((t) => t.gross),
                    borderColor: CHART_COLORS.muted,
                    backgroundColor: `${CHART_COLORS.muted}22`,
                    fill: true,
                    tension: 0.3,
                  },
                  {
                    label: "Gain",
                    data: trend.map((t) => t.gain),
                    borderColor: CHART_COLORS.primary,
                    backgroundColor: `${CHART_COLORS.primary}22`,
                    fill: true,
                    tension: 0.3,
                  },
                ],
              },
              options: {
                plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
                scales: {
                  x: { ticks: { font: { size: 11 }, color: CHART_COLORS.muted }, grid: { display: false } },
                  y: {
                    ticks: { font: { size: 11 }, color: CHART_COLORS.muted },
                    grid: { color: CHART_COLORS.grid },
                    beginAtZero: true,
                  },
                },
              },
            }}
          />
        )}
      </div>

      <CaCompositionTable composition={composition} />
    </div>
  );
}
