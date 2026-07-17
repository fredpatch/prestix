import { useEffect, useState } from "react";
import {
  reportingApi,
  type ActivityRow,
  type CaCompositionResult,
  type DashboardSummary,
  type KpiRow,
} from "@/lib/reporting.api";
import { PRESETS } from "./date-presets";

export function useDashboardData() {
  const [from, setFrom] = useState(PRESETS[0].from);
  const [to, setTo] = useState(PRESETS[0].to);
  const [basis, setBasis] = useState<"accrual" | "cash">("accrual");

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [composition, setComposition] = useState<CaCompositionResult | null>(null);
  const [clientKpis, setClientKpis] = useState<KpiRow[]>([]);
  const [apporteurKpis, setApporteurKpis] = useState<KpiRow[]>([]);
  const [employeKpis, setEmployeKpis] = useState<KpiRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { from, to, basis };
    Promise.all([
      reportingApi.getSummary(params),
      reportingApi.getCaComposition(params),
      reportingApi.getClientKpis(params),
      reportingApi.getApporteurKpis(params),
      reportingApi.getEmployeKpis(params),
      reportingApi.getRecentActivity(5),
    ]).then(([summaryRes, compRes, clientRes, apporteurRes, employeRes, activityRes]) => {
      setSummary(summaryRes.data);
      setComposition(compRes.data);
      setClientKpis(clientRes.data);
      setApporteurKpis(apporteurRes.data);
      setEmployeKpis(employeRes.data);
      setActivity(activityRes.data);
      setLoading(false);
    });
  }, [from, to, basis]);

  return {
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
  };
}
