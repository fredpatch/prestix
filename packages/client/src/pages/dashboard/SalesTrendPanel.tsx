import { useState } from "react";
import type { ChartConfiguration } from "chart.js";
import type { CaCompositionResult, CommissionTypeTrendRow } from "@/lib/reporting.api";
import { ChartCanvas, CHART_COLORS } from "@/components/analytics/ChartCanvas";
import { Button } from "@/components/ui/button";
import { fmt } from "./format";
import { cn } from "@/lib/utils";

interface SalesTrendPanelProps {
  serviceTrend: {
    bucket: string;
    billetterie: number;
    prestishop: number;
    commission: number;
    epargne: number;
    penalty: number;
  }[];
  caTrend: { bucket: string; gross: number; gain: number }[];
  commissionTypeTrend: CommissionTypeTrendRow[];
  composition: CaCompositionResult;
  loading?: boolean;
}

const SERVICE_LABELS = ["Billetterie", "PrestiShop", "Commissions", "Épargne", "Pénalités"];
const TREND_COLORS = [
  "#a77800",
  "#1a7a4c",
  "#b03a2e",
  "#5f6b7a",
  "#0f766e",
  "#c2410c",
  "#7c3aed",
  "#0369a1",
  "#be123c",
  "#4d7c0f",
];

function bucketLabel(bucket: string): string {
  if (/^\d{4}-\d{2}$/.test(bucket)) {
    return new Date(`${bucket}-01T00:00:00Z`).toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });
  }
  return bucket;
}

export function SalesTrendPanel({
  serviceTrend,
  caTrend,
  commissionTypeTrend,
  composition,
  loading = false,
}: SalesTrendPanelProps) {
  const [mode, setMode] = useState<"services" | "commissions" | "ca">("services");
  const labels = serviceTrend.map((row) => bucketLabel(row.bucket));
  const commissionLabels = commissionTypeTrend.map((row) => bucketLabel(row.bucket));
  const commissionSeries = Array.from(
    new Set(commissionTypeTrend.flatMap((row) => Object.keys(row.series))),
  );

  const legendOptions = {
    position: "bottom" as const,
    labels: { boxWidth: 10, boxHeight: 10, padding: 10, font: { size: 10 } },
  };

  const serviceConfig: ChartConfiguration<"line"> = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Billetterie",
          data: serviceTrend.map((row) => row.billetterie),
          borderColor: CHART_COLORS.primary,
          backgroundColor: "transparent",
          tension: 0.35,
          pointRadius: 2,
        },
        {
          label: "PrestiShop",
          data: serviceTrend.map((row) => row.prestishop),
          borderColor: CHART_COLORS.success,
          backgroundColor: "transparent",
          tension: 0.35,
          pointRadius: 2,
        },
        {
          label: "Commissions",
          data: serviceTrend.map((row) => row.commission),
          borderColor: CHART_COLORS.warning,
          backgroundColor: "transparent",
          tension: 0.35,
          pointRadius: 2,
        },
        {
          label: "Épargne",
          data: serviceTrend.map((row) => row.epargne),
          borderColor: CHART_COLORS.muted,
          backgroundColor: "transparent",
          tension: 0.35,
          pointRadius: 2,
        },
        {
          label: "Pénalités",
          data: serviceTrend.map((row) => row.penalty),
          borderColor: CHART_COLORS.danger,
          backgroundColor: "transparent",
          tension: 0.35,
          pointRadius: 2,
        },
      ],
    },
    options: {
      interaction: { mode: "index", intersect: false },
      plugins: { legend: legendOptions },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => fmt(Number(value)) },
          grid: { color: CHART_COLORS.grid },
        },
      },
    },
  };

  const commissionTypeConfig: ChartConfiguration<"line"> = {
    type: "line",
    data: {
      labels: commissionLabels,
      datasets: commissionSeries.map((label, index) => ({
        label,
        data: commissionTypeTrend.map((row) => row.series[label] ?? 0),
        borderColor: TREND_COLORS[index % TREND_COLORS.length],
        backgroundColor: "transparent",
        tension: 0.35,
        pointRadius: 2,
        borderWidth: 2,
      })),
    },
    options: {
      interaction: { mode: "index", intersect: false },
      plugins: { legend: legendOptions },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => fmt(Number(value)) },
          grid: { color: CHART_COLORS.grid },
        },
      },
    },
  };

  const grossGainConfig: ChartConfiguration<"bar"> = {
    type: "bar",
    data: {
      labels: caTrend.map((row) => bucketLabel(row.bucket)),
      datasets: [
        {
          label: "CA brut",
          data: caTrend.map((row) => row.gross),
          backgroundColor: CHART_COLORS.primary,
          borderRadius: 2,
        },
        {
          label: "Gain",
          data: caTrend.map((row) => row.gain),
          backgroundColor: CHART_COLORS.success,
          borderRadius: 2,
        },
      ],
    },
    options: {
      plugins: { legend: legendOptions },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => fmt(Number(value)) },
          grid: { color: CHART_COLORS.grid },
        },
      },
    },
  };

  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[13px] font-semibold text-neutral-900">Évolution des ventes</p>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Services, types de commissions ou CA/gain sur la période.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="grid grid-cols-3 rounded-lg border border-neutral-200 bg-white p-0.5 sm:inline-flex">
            {[
              ["services", "Services"],
              ["commissions", "Commissions"],
              ["ca", "CA / Gain"],
            ].map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode(value as "services" | "commissions" | "ca")}
                className={cn(
                  "h-8 px-2 text-[11px] sm:px-3 sm:text-xs",
                  mode === value && "bg-neutral-100 text-neutral-900",
                )}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="grid w-full grid-cols-2 gap-3 text-left sm:w-auto sm:text-right">
            <div>
              <p className="text-[10.5px] uppercase tracking-wide text-neutral-400">CA brut</p>
              <p className="text-[13px] font-bold tabular-nums text-neutral-900">
                {fmt(composition.totalGross)} XAF
              </p>
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-wide text-neutral-400">Gain</p>
              <p className="text-[13px] font-bold tabular-nums text-brand-gold-dark">
                {fmt(composition.totalGain)} XAF
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-12 text-center text-[12px] text-neutral-500">Chargement...</div>
      ) : serviceTrend.length === 0 && caTrend.length === 0 && commissionTypeTrend.length === 0 ? (
        <div className="px-4 py-12 text-center text-[12px] text-neutral-500">
          Aucune donnée sur la période.
        </div>
      ) : (
        <div className="overflow-x-auto p-3 sm:p-4">
          {mode === "services" && (
            <ChartCanvas
              config={serviceConfig}
              height={280}
              label="Évolution des ventes par service"
            />
          )}
          {mode === "commissions" &&
            (commissionSeries.length === 0 ? (
              <div className="py-12 text-center text-[12px] text-neutral-500">
                Aucune commission sur la période.
              </div>
            ) : (
              <ChartCanvas
                config={commissionTypeConfig}
                height={280}
                label="Évolution des commissions par type"
              />
            ))}
          {mode === "ca" && (
            <ChartCanvas
              config={grossGainConfig}
              height={280}
              label="Évolution du CA brut et du gain"
            />
          )}
        </div>
      )}

      <div className="grid border-t border-neutral-200 sm:grid-cols-5">
        {SERVICE_LABELS.map((label) => (
          <div
            key={label}
            className="border-t border-neutral-100 px-4 py-2 sm:border-l sm:border-t-0 first:sm:border-l-0"
          >
            <p className="text-[10.5px] font-semibold text-neutral-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
