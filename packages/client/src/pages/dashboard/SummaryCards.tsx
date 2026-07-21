import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Package, PiggyBank } from "lucide-react";
import type { DashboardSummary } from "@/lib/reporting.api";
import { fmt } from "./format";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

// Créances en retard ≠ Impayées - deliberately distinct cards, per spec.
// Each card links straight to the section it summarizes.
export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Link
        to="/creances"
        className="rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-brand-gold-dark"
      >
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1">
          <AlertTriangle size={11} /> En retard
        </p>
        <p className="mt-1 break-words text-[clamp(16px,5vw,18px)] font-bold leading-tight text-red-600">
          {fmt(summary.overdueAmount)} XAF
        </p>
        <p className="text-[10px] text-neutral-500">
          {summary.overdueCount} échéance{summary.overdueCount !== 1 ? "s" : ""}
        </p>
      </Link>
      <Link
        to="/creances?overdue=false"
        className="rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-brand-gold-dark"
      >
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1">
          <Clock size={11} /> Impayées (toutes)
        </p>
        <p className="mt-1 break-words text-[clamp(16px,5vw,18px)] font-bold leading-tight text-amber-600">
          {fmt(summary.unpaidAmount)} XAF
        </p>
        <p className="text-[10px] text-neutral-500">
          {summary.unpaidCount} échéance{summary.unpaidCount !== 1 ? "s" : ""}
        </p>
      </Link>
      <Link
        to="/stock"
        className="rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-brand-gold-dark"
      >
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1">
          <Package size={11} /> Stock bas
        </p>
        <p className="text-[18px] font-bold text-neutral-800 mt-1">{summary.lowStockCount}</p>
        <p className="text-[10px] text-neutral-500">
          article{summary.lowStockCount !== 1 ? "s" : ""} sous seuil
        </p>
      </Link>
      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1">
          <PiggyBank size={11} /> Épargne - solde net période
        </p>
        <p
          className={`mt-1 break-words text-[clamp(16px,5vw,18px)] font-bold leading-tight ${summary.epargneSoldeNetPeriode.netChange >= 0 ? "text-emerald-600" : "text-red-600"}`}
        >
          {fmt(summary.epargneSoldeNetPeriode.netChange)} XAF
        </p>
        <p className="text-[10px] text-neutral-500">
          Métrique globale - pas un solde client, pas du CA
        </p>
      </div>
    </div>
  );
}
