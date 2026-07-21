import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { type Proforma } from "@/lib/proforma.api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useProformas } from "@/hooks/queries/useProformas";
import { DataTable } from "@/components/ui/data-table";

const STATUS_STYLES: Record<Proforma["status"], string> = {
  draft: "bg-blue-50 text-blue-700",
  issued: "bg-blue-50 text-blue-700",
  expired: "bg-neutral-100 text-neutral-500",
  cancelled: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<Proforma["status"], string> = {
  draft: "Valide",
  issued: "Valide",
  expired: "Expiré",
  cancelled: "Annulé",
};

const columns: ColumnDef<Proforma, any>[] = [
  {
    id: "number",
    header: "Numéro",
    cell: ({ row }) => (
      <Link
        to={`/proformas/${row.original.id}`}
        className="text-[12px] font-medium text-brand-gold-dark hover:underline"
      >
        {row.original.number}
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
    accessorKey: "createdAt",
    header: "Créé le",
    cell: ({ row }) => (
      <span className="text-[12px] text-neutral-500">
        {new Date(row.original.createdAt).toLocaleDateString("fr-FR")}
      </span>
    ),
  },
  {
    accessorKey: "expiresAt",
    header: "Expire le",
    cell: ({ row }) => (
      <span className="text-[12px] text-neutral-500">
        {row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleString("fr-FR") : "—"}
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

export default function ProformasPage() {
  const { data: proformas = [], isLoading } = useProformas();

  usePageHeader({ title: "Proformas" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {proformas.length} proforma{proformas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/proformas/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus size={14} /> Nouvelle proforma
        </Link>
      </div>

      <DataTable columns={columns} data={proformas} loading={isLoading} emptyMessage="Aucun proforma." />
    </div>
  );
}
