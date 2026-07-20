import { useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/lib/reporting.api";
import { usePageHeader } from "@/components/layouts/lib/page-header";

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

const STOCK_TYPE_LABELS: Record<string, string> = { IN: "Entrée", OUT: "Sortie", ADJUST: "Ajustement" };
const SAVINGS_NATURE_LABELS: Record<string, string> = { deposit: "Dépôt", withdraw: "Retrait" };

interface SectionTableProps {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  emptyLabel: string;
}

function SectionTable({ title, columns, rows, emptyLabel }: SectionTableProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden mb-4">
      <div className="px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
        <p className="text-[11.5px] font-semibold text-neutral-800">{title}</p>
        <p className="text-[10.5px] text-neutral-500">{rows.length} ligne{rows.length !== 1 ? "s" : ""}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-[11.5px] text-neutral-500">{emptyLabel}</p>
      ) : (
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c}
                  className={`px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 ${i === columns.length - 1 ? "text-right" : ""}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-4 py-2 text-[12px] ${j === row.length - 1 ? "text-right font-medium text-neutral-800" : "text-neutral-700"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function EmployeeActivityDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();

  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0];
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0];
  const basis = (searchParams.get("basis") as "accrual" | "cash") ?? "accrual";

  usePageHeader({ title: "Détail employé", backTo: "/dashboard" });

  const { data: detail, isLoading } = useQuery({
    queryKey: ["employee-detail", agentId, from, to, basis],
    queryFn: () =>
      reportingApi.getEmployeeActivityDetail(parseInt(agentId!), { from, to, basis }).then((r) => r.data),
    enabled: !!agentId,
  });

  if (isLoading || !detail) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  return (
    <div>
      <p className="text-neutral-500 text-sm mb-6">
        Détail des transactions pour la période sélectionnée — utile pour les décisions de prime
        d'encouragement.
      </p>

      <SectionTable
        title="Factures émises"
        columns={["Facture", "Client", "Date", "Montant (XAF)"]}
        rows={detail.invoices.map((i) => [i.number ?? `#${i.id}`, i.partyName, fmtDate(i.date), fmt(i.amount)])}
        emptyLabel="Aucune facture émise sur cette période."
      />

      <SectionTable
        title="Paiements enregistrés"
        columns={["Facture", "Méthode", "Date", "Montant (XAF)"]}
        rows={detail.payments.map((p) => [
          p.invoiceNumber ?? `#${p.invoiceId}`,
          METHOD_LABELS[p.method] ?? p.method,
          fmtDate(p.date),
          fmt(p.amount),
        ])}
        emptyLabel="Aucun paiement enregistré sur cette période."
      />

      <SectionTable
        title="Commissions enregistrées"
        columns={["Type", "Date", "Montant (XAF)"]}
        rows={detail.commissions.map((c) => [c.typeLabel, fmtDate(c.date), fmt(c.amount)])}
        emptyLabel="Aucune commission enregistrée sur cette période."
      />

      <SectionTable
        title="Mouvements de stock"
        columns={["Article", "Type", "Quantité", "Date"]}
        rows={detail.stockMovements.map((m) => [
          m.articleName,
          STOCK_TYPE_LABELS[m.type] ?? m.type,
          m.quantity,
          fmtDate(m.date),
        ])}
        emptyLabel="Aucun mouvement de stock sur cette période."
      />

      <SectionTable
        title="Mouvements épargne"
        columns={["Nature", "Date", "Montant (XAF)"]}
        rows={detail.savingsTransactions.map((s) => [
          SAVINGS_NATURE_LABELS[s.nature] ?? s.nature,
          fmtDate(s.date),
          fmt(s.amount),
        ])}
        emptyLabel="Aucun mouvement épargne sur cette période."
      />
    </div>
  );
}
