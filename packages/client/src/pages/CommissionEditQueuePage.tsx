import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Clock3,
  Eye,
  History,
  LayoutGrid,
  Loader2,
  Search,
  Table2,
  UserRoundCheck,
  X,
} from "lucide-react";
import { type CommissionEditRequest, type CommissionTransaction } from "@/lib/commission.api";
import { type User } from "@/lib/users.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import {
  type CommissionEditRequestStatusFilter,
  useCommissionEditRequests,
} from "@/hooks/queries/useCommissionEditRequests";
import { useCommissionAll } from "@/hooks/queries/useCommissionAll";
import { useUsers } from "@/hooks/queries/useUsers";
import { useCommissionTypes } from "@/hooks/queries/useCommissionTypes";
import { useApproveCommissionEditRequestMutation } from "@/hooks/mutations/useApproveCommissionEditRequest";
import { useRejectCommissionEditRequestMutation } from "@/hooks/mutations/useRejectCommissionEditRequest";
import { UserKpiCard } from "./users/components/UserKpiCard";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const FIELD_LABELS: Record<string, string> = {
  date: "Date",
  commissionAmount: "Montant",
  note: "Note",
  clientPartyId: "Client",
  referrerPartyId: "Référent",
  details: "Champs spécifiques",
};

const STATUS_LABELS: Record<CommissionEditRequest["status"], string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
};

const STATUS_CLASSES: Record<CommissionEditRequest["status"], string> = {
  pending: "bg-warning-bg text-warning-text border-warning-border",
  approved: "bg-success-bg text-success-text border-success-border",
  rejected: "bg-danger-bg text-danger-text border-danger-border",
};

type ViewMode = "table" | "grid";

interface RequestContext {
  request: CommissionEditRequest;
  transaction?: CommissionTransaction;
  requester?: User;
  reviewer?: User;
  typeLabel?: string;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (key === "date") return formatDate(value as string);
  if (key === "commissionAmount") return `${Number(value).toLocaleString("fr-FR")} XAF`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function statusBadge(status: CommissionEditRequest["status"]) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10.5px] font-semibold",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function CommissionEditQueuePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<CommissionEditRequestStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RequestContext | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const isMobile = useIsMobile();

  usePageHeader({
    title: "Demandes de modification",
    helpTopic: "commissions",
    guide: {
      steps: [
        "Consultez les demandes de modification en attente.",
        "Approuvez ou rejetez avec un motif — l'historique reste visible dans les deux cas.",
      ],
    },
  });

  useEffect(() => {
    if (isMobile) setViewMode("grid");
  }, [isMobile]);

  const { data: requests = [], isLoading: loadingRequests } = useCommissionEditRequests("all");
  const { data: transactionList = [] } = useCommissionAll();
  const transactions: Record<number, CommissionTransaction> = Object.fromEntries(
    transactionList.map((c) => [c.id, c]),
  );

  const { data: userList } = useUsers({});
  const users: Record<number, User> = Object.fromEntries(
    (userList?.data ?? []).map((u: User) => [u.id, u]),
  );

  const { data: types = [] } = useCommissionTypes();

  const approveMutation = useApproveCommissionEditRequestMutation();
  const rejectMutation = useRejectCommissionEditRequestMutation();

  const contexts = useMemo<RequestContext[]>(() => {
    return requests.map((request) => {
      const transaction = transactions[request.commissionTransactionId];
      return {
        request,
        transaction,
        requester: users[request.requestedBy],
        reviewer: request.reviewedBy ? users[request.reviewedBy] : undefined,
        typeLabel: transaction
          ? types.find((type) => type.code === transaction.type)?.label
          : undefined,
      };
    });
  }, [requests, transactions, types, users]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return contexts.filter((ctx) => {
      const { request, requester, reviewer, transaction, typeLabel } = ctx;
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesType =
        typeFilter === "__all__" || transaction?.type === typeFilter || typeLabel === typeFilter;
      const searchable = [
        request.id,
        request.commissionTransactionId,
        request.reason,
        request.reviewNote,
        requester?.fullName,
        reviewer?.fullName,
        typeLabel,
        transaction?.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && matchesType && (!needle || searchable.includes(needle));
    });
  }, [contexts, search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const pending = requests.filter((request) => request.status === "pending").length;
    const approved = requests.filter((request) => request.status === "approved").length;
    const rejected = requests.filter((request) => request.status === "rejected").length;
    return { total: requests.length, pending, approved, rejected };
  }, [requests]);

  const busyId = approveMutation.isPending
    ? approveMutation.variables
    : rejectMutation.isPending
      ? rejectMutation.variables?.requestId
      : null;

  function handleApprove(requestId: number) {
    approveMutation.mutate(requestId, {
      onSuccess: () =>
        setSelected((current) => (current?.request.id === requestId ? null : current)),
    });
  }

  function handleReject(requestId: number) {
    rejectMutation.mutate(
      { requestId, note: rejectNote || undefined },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectNote("");
          setSelected((current) => (current?.request.id === requestId ? null : current));
        },
      },
    );
  }

  const columns: ColumnDef<RequestContext, any>[] = [
    {
      id: "request",
      header: "Demande",
      cell: ({ row }) => {
        const ctx = row.original;
        return (
          <div>
            <p className="text-[12px] font-semibold text-foreground">
              {ctx.typeLabel ?? ctx.transaction?.type ?? "Commission"} #
              {ctx.request.commissionTransactionId}
            </p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
              Demandée le {formatDateTime(ctx.request.createdAt)}
            </p>
          </div>
        );
      },
    },
    {
      id: "requester",
      header: "Demandeur",
      cell: ({ row }) => (
        <span className="text-[12px] text-body">
          {row.original.requester?.fullName ?? `Agent #${row.original.request.requestedBy}`}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: ({ row }) => statusBadge(row.original.request.status),
    },
    {
      id: "changes",
      header: "Champs",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="text-[12px] tabular-nums text-body">
          {Object.keys(row.original.request.proposedChanges).length}
        </span>
      ),
    },
    {
      id: "reviewedAt",
      header: "Révision",
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">
          {row.original.request.status === "pending"
            ? "Non révisée"
            : formatDateTime(row.original.request.reviewedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      meta: { align: "right" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setSelected(row.original);
          }}
        >
          <Eye size={13} /> Détail
        </Button>
      ),
    },
  ];

  if (loadingRequests) return <Loader2 className="animate-spin text-subtle" size={18} />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Suivi des corrections demandées sur les commissions, avec historique des décisions et
          comparaison des valeurs proposées.
        </p>
        <p className="text-[11px] text-subtle">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} affiché
          {filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UserKpiCard
          label="Total demandes"
          value={String(stats.total)}
          detail={`${stats.pending} en attente`}
          icon={History}
          tone="gold"
        />
        <UserKpiCard
          label="À traiter"
          value={String(stats.pending)}
          detail="Demandes sans décision"
          icon={Clock3}
          tone={stats.pending > 0 ? "danger" : "neutral"}
        />
        <UserKpiCard
          label="Approuvées"
          value={String(stats.approved)}
          detail="Corrections appliquées"
          icon={UserRoundCheck}
          tone="success"
        />
        <UserKpiCard
          label="Refusées"
          value={String(stats.rejected)}
          detail="Demandes conservées en historique"
          icon={X}
          tone={stats.rejected > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 border-y border-border py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(220px,320px)_180px_220px]">
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une demande..."
              className="pl-8"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as CommissionEditRequestStatusFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvées</SelectItem>
              <SelectItem value="rejected">Refusées</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type de commission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type.code} value={type.code}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="inline-flex w-fit rounded-lg border border-border bg-card p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={cn("h-8 gap-1.5", viewMode === "table" && "bg-surface-subtle text-foreground")}
          >
            <Table2 size={13} />
            Tableau
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={cn("h-8 gap-1.5", viewMode === "grid" && "bg-surface-subtle text-foreground")}
          >
            <LayoutGrid size={13} />
            Grille
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Aucune demande ne correspond aux filtres."
          onRowClick={setSelected}
        />
      ) : (
        <RequestGrid
          requests={filtered}
          busyId={busyId}
          rejectingId={rejectingId}
          rejectNote={rejectNote}
          onSelect={setSelected}
          onApprove={handleApprove}
          onReject={handleReject}
          onStartReject={setRejectingId}
          onRejectNote={setRejectNote}
        />
      )}

      <RequestDetailDialog
        context={selected}
        busyId={busyId}
        rejectingId={rejectingId}
        rejectNote={rejectNote}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setRejectingId(null);
            setRejectNote("");
          }
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        onStartReject={setRejectingId}
        onRejectNote={setRejectNote}
      />
    </div>
  );
}

function RequestGrid({
  requests,
  busyId,
  rejectingId,
  rejectNote,
  onSelect,
  onApprove,
  onReject,
  onStartReject,
  onRejectNote,
}: {
  requests: RequestContext[];
  busyId: number | null;
  rejectingId: number | null;
  rejectNote: string;
  onSelect: (context: RequestContext) => void;
  onApprove: (requestId: number) => void;
  onReject: (requestId: number) => void;
  onStartReject: (requestId: number | null) => void;
  onRejectNote: (note: string) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[12px] text-muted-foreground">
        Aucune demande ne correspond aux filtres.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {requests.map((ctx) => (
        <div key={ctx.request.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {ctx.typeLabel ?? ctx.transaction?.type ?? "Commission"} #
                {ctx.request.commissionTransactionId}
              </p>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                {ctx.requester?.fullName ?? `Agent #${ctx.request.requestedBy}`}
              </p>
            </div>
            {statusBadge(ctx.request.status)}
          </div>

          <p className="mt-3 line-clamp-2 min-h-[34px] rounded border border-border bg-surface-muted px-3 py-2 text-[11.5px] leading-relaxed text-body">
            {ctx.request.reason}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-[11px]">
            <div>
              <p className="text-subtle">Demandée</p>
              <p className="mt-0.5 font-medium text-body">
                {formatDate(ctx.request.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-subtle">Champs</p>
              <p className="mt-0.5 font-medium tabular-nums text-body">
                {Object.keys(ctx.request.proposedChanges).length}
              </p>
            </div>
          </div>

          {rejectingId === ctx.request.id ? (
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <Input
                placeholder="Motif du refus (optionnel)"
                value={rejectNote}
                onChange={(event) => onRejectNote(event.target.value)}
                className="h-8 text-[12px]"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => onStartReject(null)}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(ctx.request.id)}
                  disabled={busyId === ctx.request.id}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
              <Button size="sm" variant="ghost" onClick={() => onSelect(ctx)}>
                <Eye size={13} /> Détail
              </Button>
              {ctx.request.status === "pending" && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Refuser"
                    onClick={() => onStartReject(ctx.request.id)}
                    disabled={busyId === ctx.request.id}
                  >
                    <X size={13} />
                  </Button>
                  <Button
                    size="icon"
                    title="Approuver"
                    onClick={() => onApprove(ctx.request.id)}
                    disabled={busyId === ctx.request.id}
                  >
                    {busyId === ctx.request.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RequestDetailDialog({
  context,
  busyId,
  rejectingId,
  rejectNote,
  onOpenChange,
  onApprove,
  onReject,
  onStartReject,
  onRejectNote,
}: {
  context: RequestContext | null;
  busyId: number | null;
  rejectingId: number | null;
  rejectNote: string;
  onOpenChange: (open: boolean) => void;
  onApprove: (requestId: number) => void;
  onReject: (requestId: number) => void;
  onStartReject: (requestId: number | null) => void;
  onRejectNote: (note: string) => void;
}) {
  const request = context?.request;
  const transaction = context?.transaction;

  return (
    <Dialog open={Boolean(context)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-card sm:max-w-3xl">
        {context && request && (
          <>
            <DialogHeader>
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle className="text-[17px] font-bold text-foreground">
                    Demande #{request.id}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[12px] text-muted-foreground">
                    {context.typeLabel ?? transaction?.type ?? "Commission"} #
                    {request.commissionTransactionId} - demandée par{" "}
                    {context.requester?.fullName ?? `Agent #${request.requestedBy}`}
                  </DialogDescription>
                </div>
                {statusBadge(request.status)}
              </div>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailStat label="Demandée" value={formatDateTime(request.createdAt)} />
              <DetailStat
                label="Révisée"
                value={
                  request.status === "pending" ? "Non révisée" : formatDateTime(request.reviewedAt)
                }
              />
              <DetailStat
                label="Réviseur"
                value={
                  request.status === "pending"
                    ? "Non assigné"
                    : (context.reviewer?.fullName ?? `Utilisateur #${request.reviewedBy}`)
                }
              />
            </div>

            <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Raison
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-body">
                {request.reason}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Champ
                    </th>
                    <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Valeur avant révision
                    </th>
                    <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Proposition
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(request.proposedChanges).map(([key, newValue]) => {
                    const currentValue = transaction
                      ? (transaction as unknown as Record<string, unknown>)[key]
                      : undefined;
                    return (
                      <tr key={key} className="border-t border-border">
                        <td className="px-4 py-2 text-[12px] text-body">
                          {FIELD_LABELS[key] ?? key}
                        </td>
                        <td className="px-4 py-2 text-[12px] text-muted-foreground">
                          {formatValue(key, currentValue)}
                        </td>
                        <td className="px-4 py-2 text-[12px] font-medium text-success-text">
                          {formatValue(key, newValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {request.reviewNote && (
              <div className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-danger-text">
                  Note de révision
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-danger-text">
                  {request.reviewNote}
                </p>
              </div>
            )}

            {request.status === "pending" && rejectingId === request.id && (
              <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
                <Input
                  placeholder="Motif du refus (optionnel)"
                  value={rejectNote}
                  onChange={(event) => onRejectNote(event.target.value)}
                />
              </div>
            )}

            <DialogFooter>
              {request.status === "pending" ? (
                rejectingId === request.id ? (
                  <>
                    <Button variant="secondary" onClick={() => onStartReject(null)}>
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => onReject(request.id)}
                      disabled={busyId === request.id}
                    >
                      Confirmer le refus
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => onStartReject(request.id)}
                      disabled={busyId === request.id}
                    >
                      <X size={13} /> Refuser
                    </Button>
                    <Button onClick={() => onApprove(request.id)} disabled={busyId === request.id}>
                      {busyId === request.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      Approuver
                    </Button>
                  </>
                )
              ) : (
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Fermer
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
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-subtle">
        {label}
      </p>
      <p className="mt-1 truncate text-[12px] font-medium text-body">{value}</p>
    </div>
  );
}
