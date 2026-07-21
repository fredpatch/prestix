import { Link } from "react-router-dom";
import { AlertTriangle, Banknote, Clock, Package, PiggyBank, TrendingUp } from "lucide-react";
import type { DashboardSummary } from "@/lib/reporting.api";
import { fmt } from "./format";
import { cn } from "@/lib/utils";

interface DashboardMetricCardsProps {
  summary: DashboardSummary;
}

const toneClasses = {
  neutral: "text-neutral-800 bg-neutral-50 border-neutral-200",
  gold: "text-brand-gold-dark bg-brand-gold-light/25 border-brand-gold-light/60",
  danger: "text-red-700 bg-red-50 border-red-100",
  success: "text-emerald-700 bg-emerald-50 border-emerald-100",
  warning: "text-amber-700 bg-amber-50 border-amber-100",
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
  to,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof AlertTriangle;
  tone?: keyof typeof toneClasses;
  to?: string;
}) {
  const content = (
    <div className="min-w-0 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-brand-gold-dark">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            {label}
          </p>
          <p className="mt-1 break-words text-[clamp(16px,5vw,19px)] font-bold leading-tight tabular-nums text-neutral-900">
            {value}
          </p>
          <p className="mt-1 truncate text-[10.5px] text-neutral-500">{detail}</p>
        </div>
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
            toneClasses[tone],
          )}
        >
          <Icon size={16} />
        </span>
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

export function DashboardMetricCards({ summary }: DashboardMetricCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <MetricCard
        label="CA brut"
        value={`${fmt(summary.caComposition.totalGross)} XAF`}
        detail="Sur la période"
        icon={Banknote}
        tone="gold"
      />
      <MetricCard
        label="Gain total"
        value={`${fmt(summary.caComposition.totalGain)} XAF`}
        detail="Marge et commissions"
        icon={TrendingUp}
        tone="success"
      />
      <MetricCard
        label="En retard"
        value={`${fmt(summary.overdueAmount)} XAF`}
        detail={`${summary.overdueCount} échéance${summary.overdueCount !== 1 ? "s" : ""}`}
        icon={AlertTriangle}
        tone={summary.overdueCount > 0 ? "danger" : "neutral"}
        to="/creances"
      />
      <MetricCard
        label="Impayées"
        value={`${fmt(summary.unpaidAmount)} XAF`}
        detail={`${summary.unpaidCount} échéance${summary.unpaidCount !== 1 ? "s" : ""}`}
        icon={Clock}
        tone={summary.unpaidCount > 0 ? "warning" : "neutral"}
        to="/creances?overdue=false"
      />
      <MetricCard
        label="Stock bas"
        value={String(summary.lowStockCount)}
        detail={`Article${summary.lowStockCount !== 1 ? "s" : ""} sous seuil`}
        icon={Package}
        tone={summary.lowStockCount > 0 ? "danger" : "neutral"}
        to="/stock"
      />
      <MetricCard
        label="Épargne net"
        value={`${fmt(summary.epargneSoldeNetPeriode.netChange)} XAF`}
        detail={`${fmt(summary.epargneSoldeNetPeriode.totalDeposits)} déposés`}
        icon={PiggyBank}
        tone={summary.epargneSoldeNetPeriode.netChange >= 0 ? "success" : "danger"}
      />
    </div>
  );
}
