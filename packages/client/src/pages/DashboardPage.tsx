import { useState } from "react";
import { Loader2 } from "lucide-react";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { PRESETS } from "./dashboard/date-presets";
import { DashboardFilterBar } from "./dashboard/DashboardFilterBar";
import { DashboardMetricCards } from "./dashboard/DashboardMetricCards";
import { RecentActivityFeed } from "./dashboard/RecentActivityFeed";
import { RecentSalesPanel } from "./dashboard/RecentSalesPanel";
import { SalesTrendPanel } from "./dashboard/SalesTrendPanel";
import { TopServicesPanel } from "./dashboard/TopServicesPanel";
import { TopPartiesPanel } from "./dashboard/TopPartiesPanel";
import { TopEmployeesPanel } from "./dashboard/TopEmployeesPanel";
import { useDashboardSummary } from "@/hooks/queries/useDashboardSummary";
import { useCaComposition } from "@/hooks/queries/useCaComposition";
import { useClientKpis } from "@/hooks/queries/useClientKpis";
import { useApporteurKpis } from "@/hooks/queries/useApporteurKpis";
import { useEmployeeKpis } from "@/hooks/queries/useEmployeeKpis";
import { useRecentActivity } from "@/hooks/queries/useRecentActivity";
import { useRecentSales } from "@/hooks/queries/useRecentSales";
import { useCaTrend } from "@/hooks/queries/useCaTrend";
import { useServiceTrend } from "@/hooks/queries/useServiceTrend";
import { useCommissionTypeTrend } from "@/hooks/queries/useCommissionTypeTrend";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  usePageHeader({
    title: "Tableau de bord",
    helpTopic: "dashboard",
    guide: {
      steps: [
        "Ajustez la période via les filtres en haut de page.",
        "Basculez entre comptabilité d'engagement et encaissement réel (accrual/cash).",
        "Cliquez sur un employé pour voir son détail d'activité.",
      ],
    },
  });

  const [from, setFrom] = useState(PRESETS[0].from);
  const [to, setTo] = useState(PRESETS[0].to);
  const [basis, setBasis] = useState<"accrual" | "cash">("accrual");
  const [showActivity, setShowActivity] = useState(false);
  const params = { from, to, basis };

  const { data: summary, isLoading: loadingSummary } = useDashboardSummary(params);
  const { data: composition, isLoading: loadingComposition } = useCaComposition(params);
  const { data: caTrend = [], isLoading: loadingCaTrend } = useCaTrend(params);
  const { data: serviceTrend = [], isLoading: loadingServiceTrend } = useServiceTrend(params);
  const { data: commissionTypeTrend = [], isLoading: loadingCommissionTypeTrend } =
    useCommissionTypeTrend(params);
  const { data: clientKpis = [] } = useClientKpis(params);
  const { data: apporteurKpis = [] } = useApporteurKpis(params);
  const { data: employeKpis = [] } = useEmployeeKpis(params);
  const { data: activity = [] } = useRecentActivity(5);
  const { data: recentSales = [] } = useRecentSales(5);

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
          <DashboardMetricCards summary={summary} />

          <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
            <SalesTrendPanel
              serviceTrend={serviceTrend}
              caTrend={caTrend}
              commissionTypeTrend={commissionTypeTrend}
              composition={composition}
              loading={loadingCaTrend || loadingServiceTrend || loadingCommissionTypeTrend}
            />
            <RecentSalesPanel sales={recentSales} />
          </div>

          <div className="mb-6 grid gap-4 xl:grid-cols-3">
            <TopServicesPanel composition={composition} />
            <TopPartiesPanel clients={clientKpis} referrers={apporteurKpis} />
            <TopEmployeesPanel rows={employeKpis} from={from} to={to} basis={basis} />
          </div>

          <div className="mb-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowActivity((value) => !value)}>
              {showActivity ? "Masquer les opérations" : "Afficher les opérations"}
            </Button>
          </div>
          {showActivity && <RecentActivityFeed activity={activity} />}
        </>
      )}
    </div>
  );
}
