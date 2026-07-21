import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useCreances } from "@/hooks/queries/useCreances";
import { useAccrueCreancesMutation } from "@/hooks/mutations/useAccrueCreances";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { CreanceRow } from "@/lib/creance.api";

const columns: ColumnDef<CreanceRow, any>[] = [
  {
    id: "invoice",
    header: "Facture",
    cell: ({ row }) => (
      <Link
        to={`/invoices/${row.original.invoiceId}`}
        className="text-[12px] font-medium text-brand-gold-dark hover:underline"
      >
        {row.original.invoiceNumber ?? `#${row.original.invoiceId}`}
      </Link>
    ),
  },
  {
    accessorKey: "partyName",
    header: "Client",
    cell: ({ row }) => <span className="text-[12px] text-neutral-800">{row.original.partyName}</span>,
  },
  {
    id: "installment",
    header: "Échéance",
    cell: ({ row }) => (
      <span className="text-[12px] text-neutral-500">
        #{row.original.sequence} — {new Date(row.original.expectedDate).toLocaleDateString("fr-FR")}
      </span>
    ),
  },
  {
    accessorKey: "principalDue",
    header: "Principal dû",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="text-[12px] text-neutral-800">
        {parseFloat(row.original.principalDue).toLocaleString("fr-FR")}
      </span>
    ),
  },
  {
    accessorKey: "penaltyDue",
    header: "Pénalité due",
    meta: { align: "right" },
    cell: ({ row }) => {
      const penalty = parseFloat(row.original.penaltyDue);
      return penalty > 0 ? (
        <span className="text-[12px] text-red-600 font-medium">{penalty.toLocaleString("fr-FR")}</span>
      ) : (
        <span className="text-[12px] text-neutral-500">—</span>
      );
    },
  },
  {
    accessorKey: "isOverdue",
    header: "Statut",
    cell: ({ row }) => (
      <span
        className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${
          row.original.isOverdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {row.original.isOverdue ? "En retard" : "Impayée"}
      </span>
    ),
  },
];

export default function CreancesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [onlyOverdue, setOnlyOverdue] = useState(searchParams.get("overdue") !== "false");
  const [accrueResult, setAccrueResult] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useCreances({ onlyOverdue });
  const accrueMutation = useAccrueCreancesMutation();

  const canAccrueNow = user && user.role === "super_admin";

  function handleAccrueNow() {
    setAccrueResult(null);
    accrueMutation.mutate(undefined, {
      onSuccess: (data) => setAccrueResult(`${data.inserted} pénalité(s) accumulée(s).`),
    });
  }

  const totalPrincipal = rows.reduce((sum, r) => sum + parseFloat(r.principalDue), 0);
  const totalPenalty = rows.reduce((sum, r) => sum + parseFloat(r.penaltyDue), 0);

  usePageHeader({ title: "Créances" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {rows.length} échéance{rows.length !== 1 ? "s" : ""} avec solde dû
          </p>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-neutral-800 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
            className="accent-brand-gold-dark"
          />
          En retard uniquement
        </label>
      </div>

      {canAccrueNow && (
        <div className="flex items-center gap-3 mb-4">
          <Button size="sm" variant="outline" onClick={handleAccrueNow} disabled={accrueMutation.isPending}>
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

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            Principal dû
          </p>
          <p className="text-[18px] font-bold text-neutral-800 mt-1">
            {totalPrincipal.toLocaleString("fr-FR")} XAF
          </p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            Pénalités dues
          </p>
          <p className="text-[18px] font-bold text-red-600 mt-1">
            {totalPenalty.toLocaleString("fr-FR")} XAF
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        emptyMessage="Aucune créance."
      />
    </div>
  );
}
