import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Gift, Loader2, Scale, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import { ReadOnlyTable } from "@/components/ui/read-only-table";
import { useRewardRows } from "@/hooks/queries/useRewardRows";
import { useRewardSummary } from "@/hooks/queries/useRewardSummary";
import type { RewardAudience, RewardRow, RewardRule } from "@/lib/rewards.api";
import { cn } from "@/lib/utils";
import { fmt } from "../dashboard/format";

interface RewardsTabProps {
  from: string;
  to: string;
}

const audienceLabels: Record<RewardAudience, string> = {
  client: "Clients",
  referrer: "Référents",
  employee: "Équipe",
};

function money(value: number): string {
  return `${fmt(value)} XAF`;
}

function ruleRate(rule: RewardRule): string {
  return `${(rule.rateBps / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "gold" | "success" | "warning";
}) {
  return (
    <div className="min-h-[92px] rounded-lg border border-border bg-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
        </div>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border",
            tone === "gold" && "border-brand-gold-dark/20 bg-brand-gold-dark/10 text-brand-gold-dark",
            tone === "success" && "border-success-border bg-success-bg text-success-text",
            tone === "warning" && "border-warning-border bg-warning-bg text-warning-text",
            tone === "neutral" && "border-border bg-surface-muted text-muted-foreground",
          )}
        >
          <Icon size={16} />
        </span>
      </div>
    </div>
  );
}

function RuleTile({ rule }: { rule: RewardRule }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3",
        rule.enabled ? "border-border" : "border-warning-border bg-warning-bg/35",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11.5px] font-semibold text-body">{audienceLabels[rule.audience]}</p>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            rule.enabled
              ? "border-success-border bg-success-bg text-success-text"
              : "border-warning-border bg-warning-bg text-warning-text",
          )}
        >
          {rule.enabled ? "Actif" : "Inactif"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <p className="text-muted-foreground">Seuil gain</p>
          <p className="font-semibold tabular-nums text-body">{money(rule.thresholdGain)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Taux</p>
          <p className="font-semibold tabular-nums text-body">{ruleRate(rule)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Forfait</p>
          <p className="font-semibold tabular-nums text-body">{money(rule.fixedAmount)}</p>
        </div>
      </div>
    </div>
  );
}

function RewardTable({
  title,
  rows,
  audience,
}: {
  title: string;
  rows: RewardRow[];
  audience: "clients" | "referrers" | "employees";
}) {
  const columns: ColumnDef<RewardRow, any>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) =>
        audience === "employees" ? (
          <Link
            to={`/reporting/employees/${row.original.id}`}
            className="font-medium hover:text-brand-gold-dark hover:underline"
          >
            {row.original.name}
          </Link>
        ) : (
          <Link
            to={`/parties/${row.original.id}`}
            className="font-medium hover:text-brand-gold-dark hover:underline"
          >
            {row.original.name}
          </Link>
        ),
    },
    {
      accessorKey: "gain",
      header: "Gain suivi",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-semibold tabular-nums text-body">{money(row.original.gain)}</span>,
    },
    {
      accessorKey: "volume",
      header: "Volume",
      meta: { align: "right" },
    },
    {
      accessorKey: "estimatedReward",
      header: "Récompense estimée",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-brand-gold-dark">
          {money(row.original.estimatedReward)}
        </span>
      ),
    },
    {
      accessorKey: "eligible",
      header: "État",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            row.original.eligible
              ? "border-success-border bg-success-bg text-success-text"
              : "border-border bg-surface-muted text-muted-foreground",
          )}
        >
          {row.original.eligible ? "Éligible" : "Suivi"}
        </span>
      ),
    },
  ];

  return <ReadOnlyTable title={title} columns={columns} data={rows} limit={10} />;
}

function RewardLane({
  title,
  rows,
  audience,
}: {
  title: string;
  rows: RewardRow[];
  audience: "clients" | "referrers" | "employees";
}) {
  const maxGain = Math.max(...rows.map((row) => row.gain), 1);
  const topRows = rows.slice(0, 5);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-3.5 py-3">
        <p className="text-[11.5px] font-semibold text-body">{title}</p>
      </div>
      <div className="space-y-3 p-3.5">
        {topRows.length === 0 ? (
          <p className="py-8 text-center text-[11.5px] text-muted-foreground">Aucune donnée sur cette période.</p>
        ) : (
          topRows.map((row, index) => (
            <div key={`${audience}-${row.id}`} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-body">{row.name}</p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {row.volume} opération{row.volume > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold tabular-nums text-body">{money(row.gain)}</p>
                  <p className="text-[10.5px] tabular-nums text-brand-gold-dark">{money(row.estimatedReward)}</p>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    index === 0 ? "bg-brand-gold-dark" : "bg-muted-foreground/45",
                  )}
                  style={{ width: `${Math.max(6, (row.gain / maxGain) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function RewardsTab({ from, to }: RewardsTabProps) {
  const params = { from, to };
  const { data: summary, isLoading: loadingSummary } = useRewardSummary(params);
  const { data: clients = [], isLoading: loadingClients } = useRewardRows("clients", params);
  const { data: referrers = [], isLoading: loadingReferrers } = useRewardRows("referrers", params);
  const { data: employees = [], isLoading: loadingEmployees } = useRewardRows("employees", params);
  const loading = loadingSummary || loadingClients || loadingReferrers || loadingEmployees;

  if (loading || !summary) {
    return (
      <div className="py-16 text-center text-subtle">
        <Loader2 size={18} className="mr-2 inline animate-spin" /> Chargement...
      </div>
    );
  }

  const eligibleProfiles =
    summary.totals.eligibleClients + summary.totals.eligibleReferrers + summary.totals.eligibleEmployees;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gain suivi"
          value={money(summary.totals.monitoredGain)}
          detail="Base de calcul"
          icon={TrendingUp}
          tone="gold"
        />
        <MetricCard
          label="Gain éligible"
          value={money(summary.totals.eligibleGain)}
          detail={`${eligibleProfiles} profil${eligibleProfiles > 1 ? "s" : ""}`}
          icon={Trophy}
          tone="success"
        />
        <MetricCard
          label="Récompenses estimées"
          value={money(summary.totals.estimatedRewards)}
          detail="Simulation non comptabilisée"
          icon={Gift}
          tone="warning"
        />
        <MetricCard
          label="Périmètre"
          value={summary.globalEnabled ? "Actif" : "Inactif"}
          detail="Clients, référents, équipe"
          icon={Scale}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11.5px] font-semibold text-body">Règles de récompense</p>
            <p className="text-[10.5px] text-muted-foreground">Base actuelle : gain, période sélectionnée.</p>
          </div>
          <span className="rounded-full border border-brand-gold-dark/25 bg-brand-gold-dark/10 px-2 py-1 text-[10px] font-semibold uppercase text-brand-gold-dark">
            Prévisualisation
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {summary.rules.map((rule) => (
            <RuleTile key={rule.audience} rule={rule} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <RewardLane title="Meilleurs clients" rows={clients} audience="clients" />
        <RewardLane title="Meilleurs référents" rows={referrers} audience="referrers" />
        <RewardLane title="Meilleurs employés" rows={employees} audience="employees" />
      </div>

      <div className="grid gap-6">
        <RewardTable title="Clients suivis" rows={clients} audience="clients" />
        <RewardTable title="Référents suivis" rows={referrers} audience="referrers" />
        <RewardTable title="Équipe suivie" rows={employees} audience="employees" />
      </div>
    </div>
  );
}
