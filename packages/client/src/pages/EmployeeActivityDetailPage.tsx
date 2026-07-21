import { useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useEmployeeActivityDetail } from "@/hooks/queries/useEmployeeActivityDetail";
import { ReadOnlyTable } from "@/components/ui/read-only-table";
import type { EmployeeActivityDetail } from "@/lib/reporting.api";

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR");
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  virement: "Virement",
  credit: "Crédit / Avoir",
  epargne: "Épargne voyage",
};

const STOCK_TYPE_LABELS: Record<string, string> = {
  IN: "Entrée",
  OUT: "Sortie",
  ADJUST: "Ajustement",
};
const SAVINGS_NATURE_LABELS: Record<string, string> = { deposit: "Dépôt", withdraw: "Retrait" };

type InvoiceRow = EmployeeActivityDetail["invoices"][number];
type PaymentRow = EmployeeActivityDetail["payments"][number];
type CommissionRow = EmployeeActivityDetail["commissions"][number];
type StockMovementRow = EmployeeActivityDetail["stockMovements"][number];
type SavingsRow = EmployeeActivityDetail["savingsTransactions"][number];

const invoiceColumns: ColumnDef<InvoiceRow, any>[] = [
  {
    id: "invoice",
    header: "Facture",
    cell: ({ row }) => row.original.number ?? `#${row.original.id}`,
  },
  { accessorKey: "partyName", header: "Client" },
  { id: "date", header: "Date", cell: ({ row }) => fmtDate(row.original.date) },
  {
    id: "amount",
    header: "Montant (XAF)",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="font-medium text-neutral-800">{fmt(row.original.amount)}</span>
    ),
  },
];

const paymentColumns: ColumnDef<PaymentRow, any>[] = [
  {
    id: "invoice",
    header: "Facture",
    cell: ({ row }) => row.original.invoiceNumber ?? `#${row.original.invoiceId}`,
  },
  {
    id: "method",
    header: "Méthode",
    cell: ({ row }) => METHOD_LABELS[row.original.method] ?? row.original.method,
  },
  { id: "date", header: "Date", cell: ({ row }) => fmtDate(row.original.date) },
  {
    id: "amount",
    header: "Montant (XAF)",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="font-medium text-neutral-800">{fmt(row.original.amount)}</span>
    ),
  },
];

const commissionColumns: ColumnDef<CommissionRow, any>[] = [
  { accessorKey: "typeLabel", header: "Type" },
  { id: "date", header: "Date", cell: ({ row }) => fmtDate(row.original.date) },
  {
    id: "amount",
    header: "Montant (XAF)",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="font-medium text-neutral-800">{fmt(row.original.amount)}</span>
    ),
  },
];

const stockColumns: ColumnDef<StockMovementRow, any>[] = [
  { accessorKey: "articleName", header: "Article" },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => STOCK_TYPE_LABELS[row.original.type] ?? row.original.type,
  },
  { accessorKey: "quantity", header: "Quantité", meta: { align: "right" } },
  {
    id: "date",
    header: "Date",
    meta: { align: "right" },
    cell: ({ row }) => fmtDate(row.original.date),
  },
];

const savingsColumns: ColumnDef<SavingsRow, any>[] = [
  {
    id: "nature",
    header: "Nature",
    cell: ({ row }) => SAVINGS_NATURE_LABELS[row.original.nature] ?? row.original.nature,
  },
  { id: "date", header: "Date", cell: ({ row }) => fmtDate(row.original.date) },
  {
    id: "amount",
    header: "Montant (XAF)",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="font-medium text-neutral-800">{fmt(row.original.amount)}</span>
    ),
  },
];

export default function EmployeeActivityDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();

  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0];
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0];
  const basis = (searchParams.get("basis") as "accrual" | "cash") ?? "accrual";

  usePageHeader({ title: "Détail employé", backTo: "/dashboard" });

  const { data: detail, isLoading } = useEmployeeActivityDetail(
    agentId ? parseInt(agentId) : undefined,
    { from, to, basis },
  );

  if (isLoading || !detail) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  return (
    <div>
      <p className="text-neutral-500 text-sm mb-6">
        Détail des transactions pour la période sélectionnée - utile pour les décisions de prime
        d'encouragement.
      </p>

      <div className="mb-4">
        <ReadOnlyTable
          title="Factures émises"
          columns={invoiceColumns}
          data={detail.invoices}
          emptyMessage="Aucune facture émise sur cette période."
        />
      </div>

      <div className="mb-4">
        <ReadOnlyTable
          title="Paiements enregistrés"
          columns={paymentColumns}
          data={detail.payments}
          emptyMessage="Aucun paiement enregistré sur cette période."
        />
      </div>

      <div className="mb-4">
        <ReadOnlyTable
          title="Commissions enregistrées"
          columns={commissionColumns}
          data={detail.commissions}
          emptyMessage="Aucune commission enregistrée sur cette période."
        />
      </div>

      <div className="mb-4">
        <ReadOnlyTable
          title="Mouvements de stock"
          columns={stockColumns}
          data={detail.stockMovements}
          emptyMessage="Aucun mouvement de stock sur cette période."
        />
      </div>

      <div className="mb-4">
        <ReadOnlyTable
          title="Mouvements épargne"
          columns={savingsColumns}
          data={detail.savingsTransactions}
          emptyMessage="Aucun mouvement épargne sur cette période."
        />
      </div>
    </div>
  );
}
