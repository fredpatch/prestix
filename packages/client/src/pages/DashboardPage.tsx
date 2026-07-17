import { Loader2 } from "lucide-react";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useDashboardData } from "./dashboard/useDashboardData";
import { DashboardFilterBar } from "./dashboard/DashboardFilterBar";
import { SummaryCards } from "./dashboard/SummaryCards";
import { CaCompositionTable } from "./dashboard/CaCompositionTable";
import { KpiTable } from "./dashboard/KpiTable";
import { RecentActivityFeed } from "./dashboard/RecentActivityFeed";

export default function DashboardPage() {
  usePageHeader({ title: "Tableau de bord" });

  const {
    from,
    to,
    basis,
    setFrom,
    setTo,
    setBasis,
    summary,
    composition,
    clientKpis,
    apporteurKpis,
    employeKpis,
    activity,
    loading,
  } = useDashboardData();

  return (
    <div>
      <DashboardFilterBar
        from={from}
        to={to}
        basis={basis}
        onFromChange={setFrom}
        onToChange={setTo}
        onBasisChange={setBasis}
      />

      {loading || !summary || !composition ? (
        <Loader2 className="animate-spin text-neutral-400 mx-auto" size={18} />
      ) : (
        <>
          <SummaryCards summary={summary} />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <CaCompositionTable composition={composition} className="col-span-2" />
          </div>

          {/* KPIs - Client / Apporteur / Employé, per spec */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <KpiTable title="KPI Client" rows={clientKpis} />
            <KpiTable title="KPI Apporteur" rows={apporteurKpis} />
            <KpiTable title="KPI Employé" rows={employeKpis} />
          </div>

          <RecentActivityFeed activity={activity} />
        </>
      )}
    </div>
  );
}
