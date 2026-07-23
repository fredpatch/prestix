import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileText,
  LayoutGrid,
  Loader2,
  Plus,
  ReceiptText,
  Search,
  Table2,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { type DocumentLineView, type Proforma } from "@/lib/proforma.api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useProformas } from "@/hooks/queries/useProformas";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "grid";
type StatusFilter = "all" | Proforma["status"];

const STATUS_STYLES: Record<Proforma["status"], string> = {
  draft: "border-info-border bg-info-bg text-info-text",
  issued: "border-success-border bg-success-bg text-success-text",
  expired: "border-border bg-surface-subtle text-muted-foreground",
  cancelled: "border-danger-border bg-danger-bg text-danger-text",
};

const STATUS_LABELS: Record<Proforma["status"], string> = {
  draft: "Valide",
  issued: "Émise",
  expired: "Expirée",
  cancelled: "Annulée",
};

function money(value: string | number): string {
  const amount = typeof value === "number" ? value : parseFloat(value);
  return `${amount.toLocaleString("fr-FR")} XAF`;
}

function totalOf(proforma: Proforma): number {
  return proforma.lines.reduce((sum, line) => sum + parseFloat(line.lineTotal), 0);
}

function fmtDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function fmtDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

function proformaAgeLabel(value: string): string {
  const created = new Date(value).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays} jours`;
}

function statusBadge(status: Proforma["status"]) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10.5px] font-semibold",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function lineTypeLabel(type: DocumentLineView["lineType"]) {
  if (type === "ticket") return "Billet";
  if (type === "shop") return "PrestiShop";
  return type;
}

function proformaSummary(proforma: Proforma): string {
  const ticketCount = proforma.lines.filter((line) => line.lineType === "ticket").length;
  const shopCount = proforma.lines.filter((line) => line.lineType === "shop").length;
  const parts = [
    `${proforma.lines.length} ligne${proforma.lines.length > 1 ? "s" : ""}`,
    ticketCount > 0 ? `${ticketCount} billet${ticketCount > 1 ? "s" : ""}` : "",
    shopCount > 0 ? `${shopCount} shop` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

export default function ProformasPage() {
  const { data: proformas = [], isLoading } = useProformas();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Proforma | null>(null);
  const isMobile = useIsMobile();

  usePageHeader({
    title: "Proformas",
    helpTopic: "documents",
    guide: {
      steps: [
        "Recherchez ou filtrez les proformas par statut.",
        "Cliquez sur « Nouvelle proforma » pour en créer une.",
      ],
      tip: "Une proforma expire automatiquement 48h après sa création si elle n'est pas transformée en facture.",
    },
  });

  useEffect(() => {
    if (isMobile) setViewMode("grid");
  }, [isMobile]);

  const sortedProformas = useMemo(
    () =>
      [...proformas].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [proformas],
  );

  const filteredProformas = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sortedProformas.filter((proforma) => {
      const matchesStatus = statusFilter === "all" || proforma.status === statusFilter;
      if (!matchesStatus) return false;
      if (!needle) return true;

      return [
        proforma.number,
        STATUS_LABELS[proforma.status],
        proforma.partySnapshot?.fullName,
        proforma.partySnapshot?.phone,
        proforma.partySnapshot?.email,
        ...proforma.lines.flatMap((line) => [
          line.description,
          line.lineType,
          line.ticketDetails?.passengerName,
          line.shopDetails?.passengerName,
        ]),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [search, sortedProformas, statusFilter]);

  const latest = sortedProformas[0];
  const totalValue = proformas.reduce((sum, proforma) => sum + totalOf(proforma), 0);
  const activeCount = proformas.filter(
    (proforma) => proforma.status === "draft" || proforma.status === "issued",
  ).length;
  const expiredCount = proformas.filter((proforma) => proforma.status === "expired").length;
  const cancelledCount = proformas.filter((proforma) => proforma.status === "cancelled").length;

  const columns = useMemo<ColumnDef<Proforma, any>[]>(
    () => [
      {
        id: "number",
        header: "Proforma",
        cell: ({ row }) => (
          <div>
            <Link
              to={`/proformas/${row.original.id}`}
              className="text-[12px] font-medium text-brand-gold-dark hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {row.original.number}
            </Link>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">{proformaSummary(row.original)}</p>
          </div>
        ),
      },
      {
        id: "party",
        header: "Client",
        cell: ({ row }) => (
          <div>
            <p className="text-[12px] font-medium text-body">
              {row.original.partySnapshot?.fullName ?? "-"}
            </p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
              {row.original.partySnapshot?.phone ??
                row.original.partySnapshot?.email ??
                "Contact non renseigné"}
            </p>
          </div>
        ),
      },
      {
        id: "total",
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-[12px] font-semibold tabular-nums text-foreground">
            {money(totalOf(row.original))}
          </span>
        ),
      },
      {
        id: "dates",
        header: "Dates",
        cell: ({ row }) => (
          <div className="text-[12px] text-muted-foreground">
            <p>Créée: {fmtDate(row.original.createdAt)}</p>
            <p>Expire: {fmtDate(row.original.expiresAt)}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Aperçu rapide"
            onClick={(event) => {
              event.stopPropagation();
              setSelected(row.original);
            }}
          >
            <Eye size={13} />
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Suivi des proformas générées, de leur validité et de leur contenu avant émission de
          facture.
        </p>
        <Link to="/proformas/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus size={14} /> Nouvelle proforma
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProformaKpi
          label="Proformas"
          value={isLoading ? "..." : String(proformas.length)}
          detail={`${activeCount} active${activeCount > 1 ? "s" : ""}`}
          icon={FileText}
          tone="gold"
        />
        <ProformaKpi
          label="Valeur totale"
          value={isLoading ? "..." : money(totalValue)}
          detail="Toutes proformas listées"
          icon={ReceiptText}
          tone="success"
        />
        <ProformaKpi
          label="À surveiller"
          value={isLoading ? "..." : String(expiredCount + cancelledCount)}
          detail={`${expiredCount} expirée${expiredCount > 1 ? "s" : ""} · ${cancelledCount} annulée${cancelledCount > 1 ? "s" : ""}`}
          icon={AlertTriangle}
          tone={expiredCount + cancelledCount > 0 ? "danger" : "neutral"}
        />
        <ProformaKpi
          label="Dernière proforma"
          value={latest?.number ?? "-"}
          detail={
            latest
              ? `${latest.partySnapshot?.fullName ?? "Client"} · ${proformaAgeLabel(latest.createdAt)}`
              : "Aucune proforma"
          }
          icon={CalendarClock}
          tone="neutral"
        />
      </div>

      <div className="mb-4 grid gap-3 border-y border-border py-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(240px,420px)_180px_auto]">
          <div className="relative min-w-0">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher numéro, client, contact, ligne..."
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Valides</SelectItem>
              <SelectItem value="issued">Émises</SelectItem>
              <SelectItem value="expired">Expirées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>

          {(search || statusFilter !== "all") && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
          <p className="text-[11.5px] text-muted-foreground">
            {filteredProformas.length} résultat{filteredProformas.length !== 1 ? "s" : ""}
            {filteredProformas.length !== proformas.length ? ` sur ${proformas.length}` : ""}
          </p>
          <div className="inline-flex w-fit rounded-lg border border-border bg-card p-0.5">
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
              Tableau
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

      {isLoading ? (
        <Loader2 className="animate-spin text-subtle" size={18} />
      ) : viewMode === "grid" ? (
        <ProformaGrid proformas={filteredProformas} onSelect={setSelected} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredProformas}
          loading={isLoading}
          emptyMessage="Aucune proforma."
          onRowClick={setSelected}
        />
      )}

      <ProformaQuickView proforma={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

function ProformaGrid({
  proformas,
  onSelect,
}: {
  proformas: Proforma[];
  onSelect: (proforma: Proforma) => void;
}) {
  if (proformas.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[12px] text-muted-foreground">
        Aucune proforma.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {proformas.map((proforma) => (
        <div key={proforma.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <button type="button" className="min-w-0 text-left" onClick={() => onSelect(proforma)}>
              <p className="truncate text-[13px] font-semibold text-brand-gold-dark">
                {proforma.number}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {proforma.partySnapshot?.fullName ?? "Client non renseigné"}
              </p>
            </button>
            {statusBadge(proforma.status)}
          </div>

          <div className="mt-4">
            <p className="text-[22px] font-bold leading-tight tabular-nums text-foreground">
              {money(totalOf(proforma))}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{proformaSummary(proforma)}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
            <MiniFact label="Créée" value={fmtDate(proforma.createdAt)} />
            <MiniFact label="Expiration" value={fmtDate(proforma.expiresAt)} />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(proforma)}>
              <Eye size={13} /> Aperçu
            </Button>
            <Link
              to={`/proformas/${proforma.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Détail
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProformaQuickView({
  proforma,
  onOpenChange,
}: {
  proforma: Proforma | null;
  onOpenChange: (open: boolean) => void;
}) {
  const total = proforma ? totalOf(proforma) : 0;

  return (
    <Dialog open={Boolean(proforma)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-card sm:max-w-3xl">
        {proforma && (
          <>
            <DialogHeader>
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle className="text-[17px] font-bold text-foreground">
                    {proforma.number}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[12px] text-muted-foreground">
                    {proforma.partySnapshot?.fullName ?? "Client non renseigné"} · créée le{" "}
                    {fmtDateTime(proforma.createdAt)}
                  </DialogDescription>
                </div>
                {statusBadge(proforma.status)}
              </div>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-4">
              <MiniStat label="Total" value={money(total)} />
              <MiniStat label="Lignes" value={String(proforma.lines.length)} />
              <MiniStat label="Créée" value={fmtDate(proforma.createdAt)} />
              <MiniStat label="Expiration" value={fmtDate(proforma.expiresAt)} />
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border bg-surface-muted px-4 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Contenu de la proforma
                </p>
              </div>
              <div className="divide-y divide-neutral-100">
                {proforma.lines.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                    Aucune ligne.
                  </p>
                ) : (
                  proforma.lines.map((line) => (
                    <div
                      key={line.id}
                      className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-foreground">
                          {line.description}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                          {lineTypeLabel(line.lineType)} · quantité {line.quantity} · unité{" "}
                          {money(line.unitPrice)}
                        </p>
                      </div>
                      <p className="text-[12px] font-semibold tabular-nums text-foreground">
                        {money(line.lineTotal)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <a
                href={`/api/proformas/${proforma.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                PDF
              </a>
              <Link to={`/proformas/${proforma.id}`} className={cn(buttonVariants())}>
                Voir le détail
              </Link>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProformaKpi({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof FileText;
  tone?: "neutral" | "gold" | "success" | "danger";
}) {
  const toneClass =
    tone === "gold"
      ? "border-brand-gold-light/60 bg-brand-gold-light/20 text-brand-gold-dark"
      : tone === "success"
        ? "border-success-border bg-success-bg text-success-text"
        : tone === "danger"
          ? "border-danger-border bg-danger-bg text-danger-text"
          : "border-border bg-surface-muted text-body";

  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 break-words text-[clamp(16px,5vw,20px)] font-bold leading-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 truncate text-[10.5px] text-muted-foreground">{detail}</p>
        </div>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full border",
            toneClass,
          )}
        >
          <Icon size={16} />
        </span>
      </div>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface-muted px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 truncate text-[12px] font-medium text-body">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-subtle">
        {label}
      </p>
      <p className="mt-1 truncate text-[12px] font-medium text-body">{value}</p>
    </div>
  );
}
