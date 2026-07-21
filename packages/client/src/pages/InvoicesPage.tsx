import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { type Invoice } from "@/lib/invoice.api";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useInvoices } from "@/hooks/queries/useInvoices";
import { DataTable } from "@/components/ui/data-table";

const STATUS_STYLES: Record<Invoice["status"], string> = {
  draft: "bg-amber-50 text-amber-700",
  issued: "bg-emerald-50 text-emerald-700",
  expired: "bg-neutral-100 text-neutral-500",
  cancelled: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Brouillon",
  issued: "Émise",
  expired: "Expirée",
  cancelled: "Annulée",
};

const columns: ColumnDef<Invoice, any>[] = [
  {
    id: "number",
    header: "Numéro",
    cell: ({ row }) => (
      <Link
        to={`/invoices/${row.original.id}`}
        className="text-[12px] font-medium text-brand-gold-dark hover:underline"
      >
        {row.original.number ?? `Brouillon #${row.original.id}`}
      </Link>
    ),
  },
  {
    id: "party",
    header: "Partie",
    cell: ({ row }) => (
      <span className="text-[12px] text-neutral-800">{row.original.partySnapshot?.fullName ?? "—"}</span>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="text-[12px] text-neutral-800">
        {parseFloat(row.original.totalAmount).toLocaleString("fr-FR")} XAF
      </span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Échéance",
    cell: ({ row }) => (
      <span className="text-[12px] text-neutral-500">
        {row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString("fr-FR") : "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <span
        className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${STATUS_STYLES[row.original.status]}`}
      >
        {STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
];

export default function InvoicesPage() {
  usePageHeader({ title: "Factures" });
  const { data: invoices = [], isLoading } = useInvoices();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {invoices.length} facture{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/invoices/new"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Plus size={14} /> Facture directe (sans proforma)
          </Link>
          <Link to="/proformas/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus size={14} /> Nouvelle proforma
          </Link>
        </div>
      </div>

      <DataTable columns={columns} data={invoices} loading={isLoading} emptyMessage="Aucune facture." />
    </div>
  );
}
