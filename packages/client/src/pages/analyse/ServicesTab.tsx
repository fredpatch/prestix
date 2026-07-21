import { Loader2 } from "lucide-react";
import { CaCompositionTable } from "../dashboard/CaCompositionTable";
import { ChartCanvas, CHART_COLORS } from "@/components/analytics/ChartCanvas";
import { useCaComposition } from "@/hooks/queries/useCaComposition";
import { useServiceTrend } from "@/hooks/queries/useServiceTrend";

interface ServicesTabProps {
  from: string;
  to: string;
  basis: "accrual" | "cash";
}

type ServiceTrendPoint = {
  bucket: string;
  billetterie: number;
  prestishop: number;
  commission: number;
  epargne: number;
  penalty: number;
};

function bucketLabel(bucket: string): string {
  if (bucket.length === 7)
    return new Date(`${bucket}-01`).toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });
  return new Date(bucket).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const SERIES_COLORS = {
  billetterie: CHART_COLORS.primary,
  prestishop: CHART_COLORS.success,
  commission: CHART_COLORS.warning,
  epargne: "#6b5b95",
  penalty: CHART_COLORS.danger,
};

export function ServicesTab({ from, to, basis }: ServicesTabProps) {
  const params = { from, to, basis };
  const { data: composition, isLoading: loadingComposition } = useCaComposition(params);
  const { data: trend = [] } = useServiceTrend(params);

  if (loadingComposition || !composition) {
    return (
      <div className="text-center py-16 text-neutral-400">
        <Loader2 size={18} className="animate-spin inline mr-2" /> Chargement...
      </div>
    );
  }

  // "Plus utilisé" = volume (transaction count), deliberately distinct from
  // "génère le plus de CA/gain" (value) — Lucrèce's own framing draws this
  // exact line, a high-volume low-value service and a low-volume high-value
  // one are both worth seeing, not collapsed into one ranking.
  const byVolume = [...composition.buckets].sort((a, b) => b.volume - a.volume);
  const byGain = [...composition.buckets].sort((a, b) => b.gain - a.gain);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">
            Service le plus utilisé
          </p>
          <p className="text-[10.5px] text-neutral-500 mb-3">
            Par volume de transactions, pas par valeur.
          </p>
          {byVolume.length === 0 || byVolume[0].volume === 0 ? (
            <p className="text-[11.5px] text-neutral-500 text-center py-8">
              Aucune donnée sur cette période.
            </p>
          ) : (
            <p className="text-[20px] font-bold text-neutral-800">
              {byVolume[0].label}
              <span className="text-[12px] font-normal text-neutral-500 ml-2">
                {byVolume[0].volume} transaction{byVolume[0].volume !== 1 ? "s" : ""}
              </span>
            </p>
          )}
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">
            Service générant le plus de gain
          </p>
          <p className="text-[10.5px] text-neutral-500 mb-3">Par valeur (gain), pas par volume.</p>
          {byGain.length === 0 || byGain[0].gain === 0 ? (
            <p className="text-[11.5px] text-neutral-500 text-center py-8">
              Aucune donnée sur cette période.
            </p>
          ) : (
            <p className="text-[20px] font-bold text-brand-gold-dark">
              {byGain[0].label}
              <span className="text-[12px] font-normal text-neutral-500 ml-2">
                {byGain[0].gain.toLocaleString("fr-FR")} XAF
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-6">
        <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">Évolution par service</p>
        <p className="text-[10.5px] text-neutral-500 mb-3">
          CA brut par catégorie, granularité adaptée à la période sélectionnée.
        </p>
        {trend.length === 0 ? (
          <p className="text-[11.5px] text-neutral-500 text-center py-12">
            Aucune donnée sur cette période.
          </p>
        ) : (
          <ChartCanvas
            label="Évolution par service"
            config={{
              type: "line",
              data: {
                labels: trend.map((t) => bucketLabel(t.bucket)),
                datasets: [
                  {
                    label: "Billetterie",
                    data: trend.map((t) => t.billetterie),
                    borderColor: SERIES_COLORS.billetterie,
                    tension: 0.3,
                  },
                  {
                    label: "PrestiShop",
                    data: trend.map((t) => t.prestishop),
                    borderColor: SERIES_COLORS.prestishop,
                    tension: 0.3,
                  },
                  {
                    label: "Commissions",
                    data: trend.map((t) => t.commission),
                    borderColor: SERIES_COLORS.commission,
                    tension: 0.3,
                  },
                  {
                    label: "Épargne (frais)",
                    data: trend.map((t) => t.epargne),
                    borderColor: SERIES_COLORS.epargne,
                    tension: 0.3,
                  },
                  {
                    label: "Pénalités",
                    data: trend.map((t) => t.penalty),
                    borderColor: SERIES_COLORS.penalty,
                    tension: 0.3,
                  },
                ],
              },
              options: {
                plugins: {
                  legend: { position: "top", labels: { font: { size: 10.5 }, boxWidth: 10 } },
                },
                scales: {
                  x: {
                    ticks: { font: { size: 11 }, color: CHART_COLORS.muted },
                    grid: { display: false },
                  },
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

      <CaCompositionTable composition={composition} showVolume />
    </div>
  );
}
