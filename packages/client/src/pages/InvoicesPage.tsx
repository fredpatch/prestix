import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
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
import { type Invoice } from "@/lib/invoice.api";
import { cn } from "@/lib/utils";
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
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useInvoices } from "@/hooks/queries/useInvoices";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  DocumentEmptyState,
  DocumentKpiCard,
  DocumentLineCard,
  DocumentStatusBadge,
  fmtDate,
  fmtDateTime,
  lineSummary,
  money,
  type DocumentTone,
} from "@/pages/documents/components/DocumentWorkspace";

type ViewMode = "table" | "grid";
type StatusFilter = "all" | Invoice["status"];
type PaymentFilter = "all" | Invoice["paymentStatus"];

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Brouillon",
  issued: "Emise",
  expired: "Expiree",
  cancelled: "Annulee",
};

const STATUS_TONES: Record<Invoice["status"], DocumentTone> = {
  draft: "warning",
  issued: "success",
  expired: "warning",
  cancelled: "danger",
};

const PAYMENT_LABELS: Record<Invoice["paymentStatus"], string> = {
  unpaid: "Impayee",
  partial: "Partielle",
  paid: "Payee",
};

const PAYMENT_TONES: Record<Invoice["paymentStatus"], DocumentTone> = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
};

function invoiceLabel(invoice: Invoice): string {
  return invoice.number ?? `Brouillon #${invoice.id}`;
}

function invoiceAgeLabel(value: string): string {
  const created = new Date(value).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays} jours`;
}

function isOverdue(invoice: Invoice): boolean {
  return Boolean(
    invoice.status === "issued" &&
      invoice.paymentStatus !== "paid" &&
      invoice.dueDate &&
      new Date(invoice.dueDate).getTime() < Date.now(),
  );
}

export default function InvoicesPage() {
  usePageHeader({ title: "Factures" });
  const { data: invoices = [], isLoading } = useInvoices();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) setViewMode("grid");
  }, [isMobile]);

  const sortedInvoices = useMemo(
    () =>
      [...invoices].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return sortedInvoices.filter((invoice) => {
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || invoice.paymentStatus === paymentFilter;
      if (!matchesStatus || !matchesPayment) return false;
      if (!needle) return true;

      return [
        invoiceLabel(invoice),
        STATUS_LABELS[invoice.status],
        PAYMENT_LABELS[invoice.paymentStatus],
        invoice.partySnapshot?.fullName,
        invoice.partySnapshot?.phone,
        invoice.partySnapshot?.email,
        ...invoice.lines.flatMap((line) => [
          line.description,
          line.lineType,
          line.ticketDetails?.passengerName,
          line.shopDetails?.passengerName,
        ]),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [paymentFilter, search, sortedInvoices, statusFilter]);

  const latest = sortedInvoices[0];
  const totalValue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount), 0);
  const openCount = invoices.filter((invoice) => invoice.paymentStatus !== "paid" && invoice.status === "issued").length;
  const overdueCount = invoices.filter(isOverdue).length;

  const columns = useMemo<ColumnDef<Invoice, any>[]>(
    () => [
      {
        id: "number",
        header: "Facture",
        cell: ({ row }) => (
          <div>
            <Link
              to={`/invoices/${row.original.id}`}
              className="text-[12px] font-medium text-brand-gold-dark hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {invoiceLabel(row.original)}
            </Link>
            <p className="mt-0.5 text-[10.5px] text-neutral-500">{lineSummary(row.original.lines)}</p>
          </div>
        ),
      },
      {
        id: "party",
        header: "Client",
        cell: ({ row }) => (
          <div>
            <p className="text-[12px] font-medium text-neutral-800">
              {row.original.partySnapshot?.fullName ?? "-"}
            </p>
            <p className="mt-0.5 text-[10.5px] text-neutral-500">
              {row.original.partySnapshot?.phone ??
                row.original.partySnapshot?.email ??
                "Contact non renseigne"}
            </p>
          </div>
        ),
      },
      {
        id: "total",
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-[12px] font-semibold tabular-nums text-neutral-900">
            {money(row.original.totalAmount)}
          </span>
        ),
      },
      {
        id: "dates",
        header: "Dates",
        cell: ({ row }) => (
          <div className="text-[12px] text-neutral-500">
            <p>Creee: {fmtDate(row.original.createdAt)}</p>
            <p>Echeance: {fmtDate(row.original.dueDate)}</p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Statuts",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <DocumentStatusBadge label={STATUS_LABELS[row.original.status]} tone={STATUS_TONES[row.original.status]} />
            <DocumentStatusBadge label={PAYMENT_LABELS[row.original.paymentStatus]} tone={PAYMENT_TONES[row.original.paymentStatus]} />
          </div>
        ),
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
            title="Apercu rapide"
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
        <p className="max-w-2xl text-sm text-neutral-500">
          Suivi des factures, paiements, echeances et documents issus des proformas.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/invoices/new"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Plus size={14} /> Facture directe
          </Link>
          <Link to="/proformas/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus size={14} /> Nouvelle proforma
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DocumentKpiCard
          label="Factures"
          value={isLoading ? "..." : String(invoices.length)}
          detail={`${openCount} ouverte${openCount > 1 ? "s" : ""}`}
          icon={FileText}
          tone="gold"
        />
        <DocumentKpiCard
          label="Valeur facturee"
          value={isLoading ? "..." : money(totalValue)}
          detail="Toutes factures listees"
          icon={ReceiptText}
          tone="success"
        />
        <DocumentKpiCard
          label="A surveiller"
          value={isLoading ? "..." : String(overdueCount)}
          detail="Factures emises en retard"
          icon={AlertTriangle}
          tone={overdueCount > 0 ? "danger" : "neutral"}
        />
        <DocumentKpiCard
          label="Derniere facture"
          value={latest ? invoiceLabel(latest) : "-"}
          detail={
            latest
              ? `${latest.partySnapshot?.fullName ?? "Client"} / ${invoiceAgeLabel(latest.createdAt)}`
              : "Aucune facture"
          }
          icon={CalendarClock}
          tone="neutral"
        />
      </div>

      <div className="mb-4 grid gap-3 border-y border-neutral-200 py-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(240px,420px)_180px_180px_auto]">
          <div className="relative min-w-0">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher numero, client, contact, ligne..."
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
              <SelectItem value="issued">Emises</SelectItem>
              <SelectItem value="expired">Expirees</SelectItem>
              <SelectItem value="cancelled">Annulees</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as PaymentFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les paiements</SelectItem>
              <SelectItem value="unpaid">Impayees</SelectItem>
              <SelectItem value="partial">Partielles</SelectItem>
              <SelectItem value="paid">Payees</SelectItem>
            </SelectContent>
          </Select>

          {(search || statusFilter !== "all" || paymentFilter !== "all") && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPaymentFilter("all");
              }}
            >
              Reinitialiser
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
          <p className="text-[11.5px] text-neutral-500">
            {filteredInvoices.length} resultat{filteredInvoices.length !== 1 ? "s" : ""}
            {filteredInvoices.length !== invoices.length ? ` sur ${invoices.length}` : ""}
          </p>
          <div className="inline-flex w-fit rounded-lg border border-neutral-200 bg-white p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn("h-8 gap-1.5", viewMode === "table" && "bg-neutral-100 text-neutral-900")}
            >
              <Table2 size={13} />
              Table
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("h-8 gap-1.5", viewMode === "grid" && "bg-neutral-100 text-neutral-900")}
            >
              <LayoutGrid size={13} />
              Grille
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : viewMode === "grid" ? (
        <InvoiceGrid invoices={filteredInvoices} onSelect={setSelected} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredInvoices}
          loading={isLoading}
          emptyMessage="Aucune facture."
          onRowClick={setSelected}
        />
      )}

      <InvoiceQuickView invoice={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

function InvoiceGrid({
  invoices,
  onSelect,
}: {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
}) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-8 text-center text-[12px] text-neutral-500">
        Aucune facture.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className={cn(
            "rounded-lg border bg-white p-4",
            isOverdue(invoice) ? "border-red-200 bg-red-50/30" : "border-neutral-200",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <button type="button" className="min-w-0 text-left" onClick={() => onSelect(invoice)}>
              <p className="truncate text-[13px] font-semibold text-brand-gold-dark">
                {invoiceLabel(invoice)}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                {invoice.partySnapshot?.fullName ?? "Client non renseigne"}
              </p>
            </button>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <DocumentStatusBadge label={STATUS_LABELS[invoice.status]} tone={STATUS_TONES[invoice.status]} />
              <DocumentStatusBadge label={PAYMENT_LABELS[invoice.paymentStatus]} tone={PAYMENT_TONES[invoice.paymentStatus]} />
              {isOverdue(invoice) && <DocumentStatusBadge label="En retard" tone="danger" />}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[22px] font-bold leading-tight tabular-nums text-neutral-950">
              {money(invoice.totalAmount)}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500">{lineSummary(invoice.lines)}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3">
            <MiniCard label="Creee" value={fmtDate(invoice.createdAt)} />
            <MiniCard label="Echeance" value={fmtDate(invoice.dueDate)} />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(invoice)}>
              <Eye size={13} /> Apercu
            </Button>
            <Link
              to={`/invoices/${invoice.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Detail
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoiceQuickView({
  invoice,
  onOpenChange,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(invoice)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-white sm:max-w-3xl">
        {invoice && (
          <>
            <DialogHeader>
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle className="text-[17px] font-bold text-neutral-950">
                    {invoiceLabel(invoice)}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[12px] text-neutral-500">
                    {invoice.partySnapshot?.fullName ?? "Client non renseigne"} / creee le{" "}
                    {fmtDateTime(invoice.createdAt)}
                  </DialogDescription>
                </div>
                <div className="flex flex-wrap gap-1">
                  <DocumentStatusBadge label={STATUS_LABELS[invoice.status]} tone={STATUS_TONES[invoice.status]} />
                  <DocumentStatusBadge label={PAYMENT_LABELS[invoice.paymentStatus]} tone={PAYMENT_TONES[invoice.paymentStatus]} />
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-4">
              <MiniStat label="Total" value={money(invoice.totalAmount)} />
              <MiniStat label="Lignes" value={String(invoice.lines.length)} />
              <MiniStat label="Emission" value={fmtDate(invoice.issuedAt ?? invoice.createdAt)} />
              <MiniStat label="Echeance" value={fmtDate(invoice.dueDate)} />
            </div>

            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Contenu de la facture
                </p>
              </div>
              <div className="divide-y divide-neutral-100">
                {invoice.lines.length === 0 ? (
                  <div className="p-3">
                    <DocumentEmptyState title="Aucune ligne" description="Cette facture ne contient aucun service." />
                  </div>
                ) : (
                  invoice.lines.map((line) => (
                    <div key={line.id} className="p-3">
                      <DocumentLineCard line={line} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              {invoice.status === "issued" && (
                <a
                  href={`/api/invoices/${invoice.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  PDF
                </a>
              )}
              <Link to={`/invoices/${invoice.id}`} className={cn(buttonVariants())}>
                Voir le detail
              </Link>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 truncate text-[12px] font-medium text-neutral-800">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-neutral-200 bg-white px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 truncate text-[12px] font-medium text-neutral-800">{value}</p>
    </div>
  );
}
