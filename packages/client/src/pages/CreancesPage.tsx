import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarClock,
  Eye,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  Table2,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useCreances } from "@/hooks/queries/useCreances";
import { useAccrueCreancesMutation } from "@/hooks/mutations/useAccrueCreances";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { CreanceRow } from "@/lib/creance.api";
import { UserKpiCard } from "./users/components/UserKpiCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

type ViewMode = "table" | "grid";

function amount(value: string): number {
  return parseFloat(value);
}

function money(value: number): string {
  return `${value.toLocaleString("fr-FR")} XAF`;
}

function fmtDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

function totalDue(row: CreanceRow): number {
  return amount(row.principalDue) + amount(row.penaltyDue);
}

function statusBadge(row: CreanceRow) {
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-[10.5px] font-semibold",
        row.isOverdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
      )}
    >
      {row.isOverdue ? "En retard" : "Impayée"}
    </span>
  );
}

export default function CreancesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [onlyOverdue, setOnlyOverdue] = useState(searchParams.get("overdue") !== "false");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<CreanceRow | null>(null);
  const [accrueResult, setAccrueResult] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: rows = [], isLoading } = useCreances({ onlyOverdue });
  const accrueMutation = useAccrueCreancesMutation();

  const canAccrueNow = user && user.role === "super_admin";

  useEffect(() => {
    if (isMobile) setViewMode("grid");
  }, [isMobile]);

  function handleAccrueNow() {
    setAccrueResult(null);
    accrueMutation.mutate(undefined, {
      onSuccess: (data) => setAccrueResult(`${data.inserted} pénalité(s) accumulée(s).`),
    });
  }

  const totalPrincipal = rows.reduce((sum, r) => sum + parseFloat(r.principalDue), 0);
  const totalPenalty = rows.reduce((sum, r) => sum + parseFloat(r.penaltyDue), 0);
  const overdueCount = rows.filter((row) => row.isOverdue).length;
  const totalExpected = rows.reduce((sum, row) => sum + amount(row.expectedAmount), 0);
  const totalPaid = rows.reduce(
    (sum, row) => sum + amount(row.principalPaid) + amount(row.penaltyPaid),
    0,
  );

  const filteredRows = rows.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [
      row.invoiceNumber,
      row.invoiceId,
      row.partyName,
      row.partyId,
      row.sequence,
      row.expectedDate,
      row.principalDue,
      row.penaltyDue,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const columns: ColumnDef<CreanceRow, any>[] = [
    {
      id: "invoice",
      header: "Facture",
      cell: ({ row }) => (
        <Link
          to={`/invoices/${row.original.invoiceId}`}
          onClick={(event) => event.stopPropagation()}
          className="text-[12px] font-medium text-brand-gold-dark hover:underline"
        >
          {row.original.invoiceNumber ?? `#${row.original.invoiceId}`}
        </Link>
      ),
    },
    {
      accessorKey: "partyName",
      header: "Client",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-800">{row.original.partyName}</span>
      ),
    },
    {
      id: "installment",
      header: "Échéance",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-500">
          #{row.original.sequence} - {fmtDate(row.original.expectedDate)}
        </span>
      ),
    },
    {
      accessorKey: "principalDue",
      header: "Principal dû",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-800">
          {money(amount(row.original.principalDue))}
        </span>
      ),
    },
    {
      accessorKey: "penaltyDue",
      header: "Pénalité due",
      meta: { align: "right" },
      cell: ({ row }) => {
        const penalty = amount(row.original.penaltyDue);
        return penalty > 0 ? (
          <span className="text-[12px] font-medium text-red-600">{money(penalty)}</span>
        ) : (
          <span className="text-[12px] text-neutral-500">-</span>
        );
      },
    },
    {
      accessorKey: "isOverdue",
      header: "Statut",
      cell: ({ row }) => statusBadge(row.original),
    },
    {
      id: "detail",
      header: "",
      meta: { align: "right" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          title="Voir le détail"
          onClick={(event) => {
            event.stopPropagation();
            setSelected(row.original);
          }}
        >
          <Eye size={13} />
        </Button>
      ),
    },
  ];

  usePageHeader({ title: "Créances" });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-2xl text-sm text-neutral-500">
          Échéances avec solde dû, pénalités associées et suivi des retards par client.
        </p>
        <p className="text-[11px] text-neutral-400">
          {filteredRows.length} résultat{filteredRows.length !== 1 ? "s" : ""} affiché
          {filteredRows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {canAccrueNow && (
        <div className="flex items-center gap-3 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAccrueNow}
            disabled={accrueMutation.isPending}
          >
            {accrueMutation.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Déclencher l'accumulation maintenant
          </Button>
          {accrueResult && <span className="text-[11.5px] text-neutral-500">{accrueResult}</span>}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UserKpiCard
          label="Échéances dues"
          value={String(rows.length)}
          detail={`${overdueCount} en retard`}
          icon={CalendarClock}
          tone={overdueCount > 0 ? "danger" : "gold"}
        />
        <UserKpiCard
          label="Principal dû"
          value={money(totalPrincipal)}
          detail={`${money(totalExpected)} attendu`}
          icon={WalletCards}
          tone="gold"
        />
        <UserKpiCard
          label="Pénalités dues"
          value={money(totalPenalty)}
          detail="Solde de pénalités"
          icon={AlertTriangle}
          tone={totalPenalty > 0 ? "danger" : "neutral"}
        />
        <UserKpiCard
          label="Déjà payé"
          value={money(totalPaid)}
          detail="Principal + pénalités"
          icon={BadgeDollarSign}
          tone="success"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 border-y border-neutral-200 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher facture ou client..."
              className="pl-8"
            />
          </div>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-[12px] text-neutral-800">
            <input
              type="checkbox"
              checked={onlyOverdue}
              onChange={(e) => setOnlyOverdue(e.target.checked)}
              className="accent-brand-gold-dark"
            />
            En retard uniquement
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-neutral-500">
            {rows.length} échéance{rows.length !== 1 ? "s" : ""} avec solde dû
          </p>
          <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-8 gap-1.5",
                viewMode === "table" && "bg-neutral-100 text-neutral-900",
              )}
            >
              <Table2 size={13} />
              Table
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 gap-1.5",
                viewMode === "grid" && "bg-neutral-100 text-neutral-900",
              )}
            >
              <LayoutGrid size={13} />
              Grille
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={filteredRows}
          loading={isLoading}
          emptyMessage="Aucune créance."
          onRowClick={setSelected}
        />
      ) : isLoading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : (
        <CreanceGrid rows={filteredRows} onSelect={setSelected} />
      )}

      <CreanceDetailDialog creance={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

function CreanceGrid({
  rows,
  onSelect,
}: {
  rows: CreanceRow[];
  onSelect: (row: CreanceRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-8 text-center text-[12px] text-neutral-500">
        Aucune créance.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <div key={row.installmentId} className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-neutral-900">{row.partyName}</p>
              <p className="mt-0.5 text-[10.5px] text-neutral-500">
                {row.invoiceNumber ?? `Facture #${row.invoiceId}`} - échéance #{row.sequence}
              </p>
            </div>
            {statusBadge(row)}
          </div>

          <p className="mt-3 text-[20px] font-bold tabular-nums text-neutral-900">
            {money(totalDue(row))}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3 text-[11px]">
            <div>
              <p className="text-neutral-400">Date prévue</p>
              <p className="mt-0.5 font-medium text-neutral-800">{fmtDate(row.expectedDate)}</p>
            </div>
            <div>
              <p className="text-neutral-400">Pénalité</p>
              <p className="mt-0.5 font-medium text-neutral-800">{money(amount(row.penaltyDue))}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
            <Link
              to={`/invoices/${row.invoiceId}`}
              className="text-[11.5px] font-medium text-brand-gold-dark hover:underline"
            >
              Voir facture
            </Link>
            <Button size="sm" variant="ghost" onClick={() => onSelect(row)}>
              <Eye size={13} /> Détail
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreanceDetailDialog({
  creance,
  onOpenChange,
}: {
  creance: CreanceRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(creance)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-white sm:max-w-3xl">
        {creance && (
          <>
            <DialogHeader>
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle className="text-[17px] font-bold text-neutral-950">
                    Créance - échéance #{creance.sequence}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[12px] text-neutral-500">
                    {creance.partyName} - {creance.invoiceNumber ?? `facture #${creance.invoiceId}`}
                  </DialogDescription>
                </div>
                {statusBadge(creance)}
              </div>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-4">
              <DetailStat label="Date prévue" value={fmtDate(creance.expectedDate)} />
              <DetailStat label="Montant attendu" value={money(amount(creance.expectedAmount))} />
              <DetailStat label="Total dû" value={money(totalDue(creance))} />
              <DetailStat label="Client" value={`#${creance.partyId}`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                    Principal
                  </p>
                </div>
                <DetailRows
                  rows={[
                    ["Montant attendu", money(amount(creance.expectedAmount))],
                    ["Principal payé", money(amount(creance.principalPaid))],
                    ["Principal dû", money(amount(creance.principalDue))],
                  ]}
                />
              </div>

              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                    Pénalités
                  </p>
                </div>
                <DetailRows
                  rows={[
                    ["Pénalité accumulée", money(amount(creance.penaltyAccrued))],
                    ["Pénalité payée", money(amount(creance.penaltyPaid))],
                    ["Pénalité due", money(amount(creance.penaltyDue))],
                  ]}
                />
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                Facture
              </p>
              <Link
                to={`/invoices/${creance.invoiceId}`}
                className="mt-1 inline-flex text-[12.5px] font-medium text-brand-gold-dark hover:underline"
              >
                Ouvrir {creance.invoiceNumber ?? `facture #${creance.invoiceId}`}
              </Link>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <Link to={`/invoices/${creance.invoiceId}`}>
                <Button>Voir la facture</Button>
              </Link>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-neutral-200 bg-white px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 truncate text-[12px] font-medium text-neutral-800">{value}</p>
    </div>
  );
}

function DetailRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table className="w-full text-left">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-neutral-100 last:border-0">
            <td className="px-4 py-2 text-[12px] text-neutral-500">{label}</td>
            <td className="px-4 py-2 text-right text-[12px] font-medium text-neutral-800">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
