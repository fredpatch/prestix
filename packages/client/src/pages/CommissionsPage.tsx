import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  CalendarDays,
  Clock3,
  Eye,
  LayoutGrid,
  Loader2,
  Search,
  Table2,
  Tags,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/App";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { CreateCommissionDialog } from "./commission/CreateCommissionDialog";
import { RequestCommissionEditDialog } from "./commission/RequestCommissionEditDialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { useCommissionTypes } from "@/hooks/queries/useCommissionTypes";
import { useCommissions } from "@/hooks/queries/useCommissions";
import { useCommissionParties } from "@/hooks/queries/useCommissionParties";
import { useDeleteCommissionMutation } from "@/hooks/mutations/useDeleteCommission";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  CommissionDetails,
  CommissionPeriod,
  CommissionTransaction,
} from "@/lib/commission.api";
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

function money(value: number): string {
  return `${value.toLocaleString("fr-FR")} XAF`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

function isPeriod(value: unknown): value is CommissionPeriod {
  return Boolean(
    value &&
    typeof value === "object" &&
    "start" in value &&
    "end" in value &&
    typeof (value as CommissionPeriod).start === "string" &&
    typeof (value as CommissionPeriod).end === "string",
  );
}

function formatDetailValue(value: CommissionDetails[string]): string {
  if (value === undefined || value === null || value === "") return "-";
  if (isPeriod(value)) return `${formatDate(value.start)} - ${formatDate(value.end)}`;
  if (typeof value === "number") return value.toLocaleString("fr-FR");
  return String(value);
}

export default function CommissionsPage() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<CommissionTransaction | null>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  usePageHeader({
    title: "Commissions",
    helpTopic: "commissions",
    guide: {
      steps: [
        "Choisissez le type de commission avant de saisir la transaction.",
        "Le montant est toujours saisi manuellement — il n'y a pas de calcul automatique.",
      ],
      tip: "Une commission déjà enregistrée n'est pas modifiable directement — passez par une demande de modification.",
    },
  });

  const canDelete = user && ["admin", "super_admin"].includes(user.role);

  const { data: types = [] } = useCommissionTypes();
  const { data: commissions = [], isLoading } = useCommissions({ type: typeFilter });
  const { data: parties = {} } = useCommissionParties(commissions);
  const deleteMutation = useDeleteCommissionMutation();

  useEffect(() => {
    if (isMobile) setViewMode("grid");
  }, [isMobile]);

  function typeLabel(code: string): string {
    return types.find((t) => t.code === code)?.label ?? code;
  }

  // CreateCommissionDialog/RequestCommissionEditDialog aren't on useMutation
  // yet (out of scope for this pass), so they still need this explicit
  // invalidate after their own plain API calls.
  function handleReload() {
    queryClient.invalidateQueries({ queryKey: queryKeys.commissions() });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(id);
  }

  const total = commissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
  const pendingEdits = commissions.filter((commission) => commission.pendingEditRequestId).length;
  const activeTypes = new Set(commissions.map((commission) => commission.type)).size;
  const linkedParties = new Set(
    commissions
      .flatMap((commission) => [commission.clientPartyId, commission.referrerPartyId])
      .filter(Boolean),
  ).size;

  const filteredCommissions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return commissions;
    return commissions.filter((commission) => {
      const client = commission.clientPartyId ? parties[commission.clientPartyId]?.fullName : "";
      const referrer = commission.referrerPartyId
        ? parties[commission.referrerPartyId]?.fullName
        : "";
      return [
        commission.id,
        typeLabel(commission.type),
        commission.note,
        commission.agentId,
        client,
        referrer,
        commission.commissionAmount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [commissions, parties, search, types]);

  const columns: ColumnDef<CommissionTransaction, any>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-[12px] font-medium text-body">
          {typeLabel(row.original.type)}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">
          {new Date(row.original.date).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => (
        <span
          className="text-[12px] text-muted-foreground max-w-[220px] truncate block"
          title={row.original.note}
        >
          {row.original.note || "—"}
        </span>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">
          {row.original.clientPartyId
            ? (parties[row.original.clientPartyId]?.fullName ?? "...")
            : "-"}
        </span>
      ),
    },
    {
      id: "referrer",
      header: "Référent",
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">
          {row.original.referrerPartyId
            ? (parties[row.original.referrerPartyId]?.fullName ?? "...")
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "commissionAmount",
      header: "Montant",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="text-[12px] font-medium text-body">
          {parseFloat(row.original.commissionAmount).toLocaleString("fr-FR")}
        </span>
      ),
    },
    {
      id: "editRequest",
      header: "",
      meta: { align: "right" },
      cell: ({ row }) =>
        row.original.pendingEditRequestId ? (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-warning-bg text-warning-text whitespace-nowrap">
            Modif. en attente
          </span>
        ) : (
          <span onClick={(event) => event.stopPropagation()}>
            <RequestCommissionEditDialog commission={row.original} onRequested={handleReload} />
          </span>
        ),
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
    ...(canDelete
      ? [
          {
            id: "actions",
            header: "",
            meta: { align: "right" as const },
            cell: ({ row }: { row: { original: CommissionTransaction } }) => (
              <Button
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(row.original.id);
                }}
                className="text-danger-text hover:bg-danger-bg"
                title="Supprimer"
                disabled={deleteMutation.isPending && deleteMutation.variables === row.original.id}
              >
                {deleteMutation.isPending && deleteMutation.variables === row.original.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Commissions enregistrées, montants associés et demandes de correction en cours.
        </p>
        <CreateCommissionDialog onCreated={handleReload} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UserKpiCard
          label="Total commissions"
          value={String(commissions.length)}
          detail={`${filteredCommissions.length} affichée${filteredCommissions.length > 1 ? "s" : ""}`}
          icon={BadgeDollarSign}
          tone="gold"
        />
        <UserKpiCard
          label="Montant total"
          value={money(total)}
          detail="Sur le filtre actif"
          icon={CalendarDays}
          tone="success"
        />
        <UserKpiCard
          label="Modifs en attente"
          value={String(pendingEdits)}
          detail="Demandes à suivre"
          icon={Clock3}
          tone={pendingEdits > 0 ? "danger" : "neutral"}
        />
        <UserKpiCard
          label="Types actifs"
          value={String(activeTypes)}
          detail={`${linkedParties} tiers liés`}
          icon={Tags}
          tone="neutral"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 border-y border-border py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative max-w-xs flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une commission..."
              className="pl-8"
            />
          </div>
          <Select
            value={typeFilter || "__all__"}
            onValueChange={(v) => setTypeFilter(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t.code} value={t.code}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-muted-foreground">
            {filteredCommissions.length} résultat{filteredCommissions.length !== 1 ? "s" : ""}
          </p>
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-8 gap-1.5",
                viewMode === "table" && "bg-surface-subtle text-foreground",
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
                viewMode === "grid" && "bg-surface-subtle text-foreground",
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
          data={filteredCommissions}
          loading={isLoading}
          emptyMessage="Aucune commission."
          onRowClick={setSelected}
        />
      ) : (
        <CommissionGrid
          commissions={filteredCommissions}
          parties={parties}
          canDelete={Boolean(canDelete)}
          deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
          typeLabel={typeLabel}
          onSelect={setSelected}
          onReload={handleReload}
          onDelete={handleDelete}
        />
      )}

      <CommissionDetailDialog
        commission={selected}
        parties={parties}
        canDelete={Boolean(canDelete)}
        deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
        typeLabel={typeLabel}
        onOpenChange={(open) => !open && setSelected(null)}
        onReload={handleReload}
        onDelete={handleDelete}
      />
    </div>
  );
}

function CommissionGrid({
  commissions,
  parties,
  canDelete,
  deletingId,
  typeLabel,
  onSelect,
  onReload,
  onDelete,
}: {
  commissions: CommissionTransaction[];
  parties: Record<number, { fullName: string }>;
  canDelete: boolean;
  deletingId: number | null;
  typeLabel: (code: string) => string;
  onSelect: (commission: CommissionTransaction) => void;
  onReload: () => void;
  onDelete: (id: number) => void;
}) {
  if (commissions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[12px] text-muted-foreground">
        Aucune commission.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {commissions.map((commission) => {
        const client = commission.clientPartyId
          ? parties[commission.clientPartyId]?.fullName
          : undefined;
        const referrer = commission.referrerPartyId
          ? parties[commission.referrerPartyId]?.fullName
          : undefined;
        return (
          <div key={commission.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {typeLabel(commission.type)}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  #{commission.id} - {formatDate(commission.date)}
                </p>
              </div>
              {commission.pendingEditRequestId && (
                <span className="rounded border border-warning-border bg-warning-bg px-2 py-0.5 text-[10px] font-semibold text-warning-text">
                  Modif. en attente
                </span>
              )}
            </div>

            <p className="mt-3 text-[20px] font-bold tabular-nums text-foreground">
              {money(parseFloat(commission.commissionAmount))}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-[11px]">
              <div className="min-w-0">
                <p className="text-subtle">Client</p>
                <p className="mt-0.5 truncate font-medium text-body">{client ?? "-"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-subtle">Référent</p>
                <p className="mt-0.5 truncate font-medium text-body">{referrer ?? "-"}</p>
              </div>
            </div>

            {commission.note && (
              <p className="mt-3 truncate rounded border border-border bg-surface-muted px-3 py-2 text-[11.5px] text-body">
                {commission.note}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
              <Button size="sm" variant="ghost" onClick={() => onSelect(commission)}>
                <Eye size={13} /> Détail
              </Button>
              <div className="flex items-center gap-1">
                {commission.pendingEditRequestId ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-warning-text">
                    En attente
                  </span>
                ) : (
                  <RequestCommissionEditDialog commission={commission} onRequested={onReload} />
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(commission.id)}
                    className="text-danger-text hover:bg-danger-bg"
                    title="Supprimer"
                    disabled={deletingId === commission.id}
                  >
                    {deletingId === commission.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommissionDetailDialog({
  commission,
  parties,
  canDelete,
  deletingId,
  typeLabel,
  onOpenChange,
  onReload,
  onDelete,
}: {
  commission: CommissionTransaction | null;
  parties: Record<number, { fullName: string }>;
  canDelete: boolean;
  deletingId: number | null;
  typeLabel: (code: string) => string;
  onOpenChange: (open: boolean) => void;
  onReload: () => void;
  onDelete: (id: number) => void;
}) {
  const client = commission?.clientPartyId
    ? parties[commission.clientPartyId]?.fullName
    : undefined;
  const referrer = commission?.referrerPartyId
    ? parties[commission.referrerPartyId]?.fullName
    : undefined;
  const detailEntries = Object.entries(commission?.details ?? {});

  return (
    <Dialog open={Boolean(commission)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-card sm:max-w-3xl">
        {commission && (
          <>
            <DialogHeader>
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle className="text-[17px] font-bold text-foreground">
                    Commission #{commission.id}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[12px] text-muted-foreground">
                    {typeLabel(commission.type)} - agent #{commission.agentId}
                  </DialogDescription>
                </div>
                {commission.pendingEditRequestId && (
                  <span className="w-fit rounded border border-warning-border bg-warning-bg px-2 py-0.5 text-[10.5px] font-semibold text-warning-text">
                    Modification en attente
                  </span>
                )}
              </div>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-4">
              <DetailStat label="Date" value={formatDate(commission.date)} />
              <DetailStat label="Montant" value={money(parseFloat(commission.commissionAmount))} />
              <DetailStat label="Client" value={client ?? "-"} />
              <DetailStat label="Référent" value={referrer ?? "-"} />
            </div>

            {commission.note && (
              <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Note
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-body">
                  {commission.note}
                </p>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border bg-surface-muted px-4 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Détails spécifiques
                </p>
              </div>
              {detailEntries.length === 0 ? (
                <p className="px-4 py-5 text-center text-[12px] text-muted-foreground">
                  Aucun détail spécifique.
                </p>
              ) : (
                <table className="w-full text-left">
                  <tbody>
                    {detailEntries.map(([key, value]) => (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="w-1/3 px-4 py-2 text-[12px] font-medium text-body">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-[12px] text-muted-foreground">
                          {formatDetailValue(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailStat label="Créée le" value={formatDate(commission.createdAt)} />
              <DetailStat label="Statut" value={commission.active ? "Active" : "Supprimée"} />
              <DetailStat
                label="Demande"
                value={
                  commission.pendingEditRequestId ? `#${commission.pendingEditRequestId}` : "-"
                }
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              {!commission.pendingEditRequestId && (
                <span onClick={(event) => event.stopPropagation()}>
                  <RequestCommissionEditDialog commission={commission} onRequested={onReload} />
                </span>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(commission.id)}
                  disabled={deletingId === commission.id}
                >
                  {deletingId === commission.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Supprimer
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-subtle">
        {label}
      </p>
      <p className="mt-1 truncate text-[12px] font-medium text-body">{value}</p>
    </div>
  );
}
