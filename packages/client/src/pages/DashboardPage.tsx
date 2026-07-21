import { useState } from "react";
import { Loader2 } from "lucide-react";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { PRESETS } from "./dashboard/date-presets";
import { DashboardFilterBar } from "./dashboard/DashboardFilterBar";
import { SummaryCards } from "./dashboard/SummaryCards";
import { CaCompositionTable } from "./dashboard/CaCompositionTable";
import { KpiTable } from "./dashboard/KpiTable";
import { EmployeeKpiTable } from "./dashboard/EmployeeKpiTable";
import { RecentActivityFeed } from "./dashboard/RecentActivityFeed";
import { useDashboardSummary } from "@/hooks/queries/useDashboardSummary";
import { useCaComposition } from "@/hooks/queries/useCaComposition";
import { useClientKpis } from "@/hooks/queries/useClientKpis";
import { useApporteurKpis } from "@/hooks/queries/useApporteurKpis";
import { useEmployeeKpis } from "@/hooks/queries/useEmployeeKpis";
import { useRecentActivity } from "@/hooks/queries/useRecentActivity";

export default function DashboardPage() {
  usePageHeader({ title: "Tableau de bord" });

  const [from, setFrom] = useState(PRESETS[0].from);
  const [to, setTo] = useState(PRESETS[0].to);
  const [basis, setBasis] = useState<"accrual" | "cash">("accrual");
  const params = { from, to, basis };

  const { data: summary, isLoading: loadingSummary } = useDashboardSummary(params);
  const { data: composition, isLoading: loadingComposition } = useCaComposition(params);
  const { data: clientKpis = [] } = useClientKpis(params);
  const { data: apporteurKpis = [] } = useApporteurKpis(params);
  const { data: employeKpis = [] } = useEmployeeKpis(params);
  const { data: activity = [] } = useRecentActivity(5);

  const loading = loadingSummary || loadingComposition;

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
            <EmployeeKpiTable rows={employeKpis} from={from} to={to} basis={basis} />
          </div>

          <RecentActivityFeed activity={activity} />
        </>
      )}
    </div>
  );
}
