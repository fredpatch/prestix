import { useParams, useSearchParams } from "react-router-dom";
import { BarChart3, Boxes, CircleDollarSign, FileText, Loader2, ReceiptText } from "lucide-react";
import type { ChartConfiguration } from "chart.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useEmployeeActivityDetail } from "@/hooks/queries/useEmployeeActivityDetail";
import { useUser } from "@/hooks/queries/useUser";
import { ReadOnlyTable } from "@/components/ui/read-only-table";
import type { EmployeeActivityDetail } from "@/lib/reporting.api";
import { ChartCanvas, CHART_COLORS } from "@/components/analytics/ChartCanvas";
import { UserKpiCard } from "./users/components/UserKpiCard";
import { EmployeeProfileHeader } from "./users/components/EmployeeProfileHeader";
import { useAuth } from "@/App";

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR");
}

function money(n: number): string {
  return `${fmt(n)} XAF`;
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
      <span className="font-medium text-body">{fmt(row.original.amount)}</span>
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
      <span className="font-medium text-body">{fmt(row.original.amount)}</span>
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
      <span className="font-medium text-body">{fmt(row.original.amount)}</span>
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
      <span className="font-medium text-body">{fmt(row.original.amount)}</span>
    ),
  },
];

export default function EmployeeActivityDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const numericAgentId = agentId ? parseInt(agentId) : undefined;
  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0];
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0];
  const basis = (searchParams.get("basis") as "accrual" | "cash") ?? "accrual";
  const fromUsers = searchParams.get("source") === "users";
  const canReadEmployeeProfile = user ? ["admin", "super_admin"].includes(user.role) : false;

  const { data: employee, isLoading: isEmployeeLoading } = useUser(
    canReadEmployeeProfile ? numericAgentId : undefined,
  );

  usePageHeader({
    title: employee?.fullName ?? "Détail employé",
    backTo: fromUsers ? "/users" : "/dashboard",
    helpTopic: "dashboard",
    guide: {
      steps: [
        "Détail de l'activité d'un employé sur la période sélectionnée.",
        "Utilisez la flèche en haut de page pour revenir à la liste.",
      ],
    },
  });

  const { data: detail, isLoading } = useEmployeeActivityDetail(numericAgentId, {
    from,
    to,
    basis,
  });

  if (isLoading || (canReadEmployeeProfile && isEmployeeLoading) || !detail) {
    return <Loader2 className="animate-spin text-subtle" size={18} />;
  }

  const invoiceValue = detail.invoices.reduce((sum, row) => sum + row.amount, 0);
  const paymentValue = detail.payments.reduce((sum, row) => sum + row.amount, 0);
  const commissionValue = detail.commissions.reduce((sum, row) => sum + row.amount, 0);
  const savingsValue = detail.savingsTransactions.reduce((sum, row) => sum + row.amount, 0);
  const stockQuantity = detail.stockMovements.reduce((sum, row) => sum + Math.abs(row.quantity), 0);
  const totalActions =
    detail.invoices.length +
    detail.payments.length +
    detail.commissions.length +
    detail.stockMovements.length +
    detail.savingsTransactions.length;

  const activityChart: ChartConfiguration<"doughnut"> = {
    type: "doughnut",
    data: {
      labels: ["Factures", "Paiements", "Commissions", "Stock", "Épargne"],
      datasets: [
        {
          data: [
            detail.invoices.length,
            detail.payments.length,
            detail.commissions.length,
            detail.stockMovements.length,
            detail.savingsTransactions.length,
          ],
          backgroundColor: [
            CHART_COLORS.primary,
            CHART_COLORS.success,
            CHART_COLORS.warning,
            CHART_COLORS.muted,
            CHART_COLORS.danger,
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      cutout: "62%",
    },
  };

  const valueChart: ChartConfiguration<"bar"> = {
    type: "bar",
    data: {
      labels: ["Factures", "Paiements", "Commissions", "Épargne"],
      datasets: [
        {
          label: "Montant XAF",
          data: [invoiceValue, paymentValue, commissionValue, savingsValue],
          backgroundColor: CHART_COLORS.primary,
          borderRadius: 2,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => `${Number(value).toLocaleString("fr-FR")}` },
          grid: { color: CHART_COLORS.grid },
        },
      },
    },
  };

  return (
    <div>
      {employee ? (
        <EmployeeProfileHeader employee={employee} />
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          Détail des transactions pour l'employé #{numericAgentId ?? "-"} sur la période
          sélectionnée.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <UserKpiCard
          label="Actions"
          value={String(totalActions)}
          detail={`${detail.invoices.length} factures · ${detail.payments.length} paiements`}
          icon={BarChart3}
          tone="gold"
        />
        <UserKpiCard
          label="Factures émises"
          value={money(invoiceValue)}
          detail={`${detail.invoices.length} document${detail.invoices.length > 1 ? "s" : ""}`}
          icon={FileText}
          tone="success"
        />
        <UserKpiCard
          label="Encaissements"
          value={money(paymentValue)}
          detail={`${detail.payments.length} paiement${detail.payments.length > 1 ? "s" : ""}`}
          icon={ReceiptText}
          tone="neutral"
        />
        <UserKpiCard
          label="Stock"
          value={String(stockQuantity)}
          detail={`${detail.stockMovements.length} mouvement${detail.stockMovements.length > 1 ? "s" : ""}`}
          icon={Boxes}
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 mb-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <p className="text-[12px] font-semibold text-foreground">Répartition des actions</p>
            <CircleDollarSign size={15} className="text-subtle" />
          </div>
          <ChartCanvas
            config={activityChart}
            height={260}
            label="Répartition des actions employé"
          />
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <p className="text-[12px] font-semibold text-foreground">Valeur par activité</p>
            <BarChart3 size={15} className="text-subtle" />
          </div>
          <ChartCanvas
            config={valueChart}
            height={260}
            label="Valeur financière par activité employé"
          />
        </div>
      </div>

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
