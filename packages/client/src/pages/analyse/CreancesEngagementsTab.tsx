import { Loader2, AlertTriangle } from "lucide-react";
import { ChartCanvas, CHART_COLORS } from "@/components/analytics/ChartCanvas";
import { useCreancesByParty } from "@/hooks/queries/useCreancesByParty";
import { useAccrualVsCashComparison } from "@/hooks/queries/useAccrualVsCashComparison";
import { useOpenEngagements } from "@/hooks/queries/useOpenEngagements";
import { ReadOnlyTable } from "@/components/ui/read-only-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { CreanceByParty } from "@/lib/reporting.api";
import { Link } from "react-router-dom";

interface CreancesEngagementsTabProps {
  from: string;
  to: string;
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

const creanceColumns: ColumnDef<CreanceByParty, any>[] = [
  {
    accessorKey: "partyName",
    header: "Partie",
    cell: ({ row }) => (
      <Link
        to={`/parties/${row.original.partyId}`}
        className="hover:text-brand-gold-dark hover:underline"
      >
        {row.original.partyName}
      </Link>
    ),
  },
  {
    accessorKey: "principalDue",
    header: "Principal dû",
    meta: { align: "right" },
    cell: ({ row }) => fmt(row.original.principalDue),
  },
  {
    accessorKey: "penaltyDue",
    header: "Pénalités dues",
    meta: { align: "right" },
    cell: ({ row }) => fmt(row.original.penaltyDue),
  },
  {
    accessorKey: "totalDue",
    header: "Total dû",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="font-medium text-body">{fmt(row.original.totalDue)}</span>
    ),
  },
  {
    id: "overdue",
    header: "",
    cell: ({ row }) =>
      row.original.overdueCount > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] text-danger-text">
          <AlertTriangle size={10} /> {row.original.overdueCount} en retard
        </span>
      ),
  },
];

export function CreancesEngagementsTab({ from, to }: CreancesEngagementsTabProps) {
  const { data: creances = [], isLoading: loadingCreances } = useCreancesByParty();
  const { data: comparison, isLoading: loadingComparison } = useAccrualVsCashComparison({
    from,
    to,
  });
  const { data: engagements, isLoading: loadingEngagements } = useOpenEngagements();
  const loading = loadingCreances || loadingComparison || loadingEngagements;

  if (loading || !comparison || !engagements) {
    return (
      <div className="text-center py-16 text-subtle">
        <Loader2 size={18} className="animate-spin inline mr-2" /> Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engagement vs Encaissement shown SIDE BY SIDE — deliberately not the
          toggle used everywhere else, per Lucrèce's own framing: "combien on
          gagne" vs "combien on gagne réellement" are two different questions
          worth seeing at once, not one you switch between. */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-body mb-0.5">
          Ce qu'on gagne vs. ce qu'on encaisse réellement
        </p>
        <p className="text-[10.5px] text-muted-foreground mb-3">
          Engagement (facturé) et Encaissement (payé) pour la même période, côte à côte.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-border rounded-lg p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Engagement
            </p>
            <p className="text-[18px] font-bold text-body mt-1">
              {fmt(comparison.accrual.totalGross)} XAF
            </p>
            <p className="text-[10px] text-muted-foreground">CA brut facturé</p>
            <p className="text-[13px] font-semibold text-brand-gold-dark mt-1">
              {fmt(comparison.accrual.totalGain)} XAF{" "}
              <span className="text-[10px] font-normal text-muted-foreground">gain</span>
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Encaissement
            </p>
            <p className="text-[18px] font-bold text-success-text mt-1">
              {fmt(comparison.cash.totalGross)} XAF
            </p>
            <p className="text-[10px] text-muted-foreground">Argent réellement reçu</p>
            <p className="text-[13px] font-semibold text-success-text mt-1">
              {fmt(comparison.cash.totalGain)} XAF{" "}
              <span className="text-[10px] font-normal text-muted-foreground">gain</span>
            </p>
          </div>
        </div>
        {comparison.accrual.totalGross > comparison.cash.totalGross && (
          <p className="text-[10.5px] text-warning-text bg-warning-bg border border-warning-border rounded px-2.5 py-1.5 mt-3">
            L'écart entre les deux (
            {fmt(comparison.accrual.totalGross - comparison.cash.totalGross)} XAF) représente ce qui
            est facturé mais pas encore encaissé.
          </p>
        )}
      </div>

      {/* Engagements non clôturés */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-body mb-0.5">
          Engagements non clôturés
        </p>
        <p className="text-[10.5px] text-muted-foreground mb-3">
          Affaires pas encore commises — indépendant de la période sélectionnée.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-border rounded-lg p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Factures en brouillon
            </p>
            <p className="text-[18px] font-bold text-body mt-1">
              {engagements.draftInvoiceCount}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmt(engagements.draftInvoiceValue)} XAF potentiel
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Proformas ouverts
            </p>
            <p className="text-[18px] font-bold text-body mt-1">
              {engagements.openProformaCount}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmt(engagements.openProformaValue)} XAF potentiel
            </p>
          </div>
        </div>
      </div>

      {/* Qui doit — comparaison par partie */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <p className="text-[11.5px] font-semibold text-body">
            Qui doit — créances par partie
          </p>
          <p className="text-[10.5px] text-muted-foreground">
            Toutes créances non réglées, indépendant de la période — situation actuelle.
          </p>
        </div>
        {creances.length === 0 ? (
          <p className="px-4 py-8 text-center text-[11.5px] text-muted-foreground">
            Aucune créance en cours.
          </p>
        ) : (
          <>
            <div className="p-4 border-b border-border">
              <ChartCanvas
                label="Créances par partie"
                height={Math.max(180, Math.min(creances.length, 10) * 34)}
                config={{
                  type: "bar",
                  data: {
                    labels: creances.slice(0, 10).map((c) => c.partyName),
                    datasets: [
                      {
                        label: "Montant dû (XAF)",
                        data: creances.slice(0, 10).map((c) => c.totalDue),
                        backgroundColor: CHART_COLORS.danger,
                        borderRadius: 4,
                      },
                    ],
                  },
                  options: {
                    indexAxis: "y",
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        ticks: { font: { size: 11 }, color: CHART_COLORS.muted },
                        grid: { color: CHART_COLORS.grid },
                        beginAtZero: true,
                      },
                      y: {
                        ticks: { font: { size: 11 }, color: CHART_COLORS.muted },
                        grid: { display: false },
                      },
                    },
                  },
                }}
              />
            </div>
            <ReadOnlyTable columns={creanceColumns} data={creances} bare />
          </>
        )}
      </div>
    </div>
  );
}
