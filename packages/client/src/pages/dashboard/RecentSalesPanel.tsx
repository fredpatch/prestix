import { Link } from "react-router-dom";
import { BadgeDollarSign, FileText, HandCoins } from "lucide-react";
import type { RecentSaleRow } from "@/lib/reporting.api";
import { fmt } from "./format";
import { cn } from "@/lib/utils";

interface RecentSalesPanelProps {
  sales: RecentSaleRow[];
}

const KIND_LABELS: Record<RecentSaleRow["kind"], string> = {
  invoice: "Facture",
  payment: "Paiement",
  commission: "Commission",
};

const KIND_STYLES: Record<RecentSaleRow["kind"], string> = {
  invoice: "bg-brand-gold-light/25 text-brand-gold-dark border-brand-gold-light/60",
  payment: "bg-emerald-50 text-emerald-700 border-emerald-100",
  commission: "bg-neutral-50 text-neutral-700 border-neutral-200",
};

function iconFor(kind: RecentSaleRow["kind"]) {
  if (kind === "invoice") return <FileText size={14} />;
  if (kind === "payment") return <HandCoins size={14} />;
  return <BadgeDollarSign size={14} />;
}

export function RecentSalesPanel({ sales }: RecentSalesPanelProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <p className="text-[13px] font-semibold text-neutral-900">Ventes récentes</p>
        <p className="mt-0.5 text-[11px] text-neutral-500">
          5 dernières transactions commerciales.
        </p>
      </div>
      <div className="divide-y divide-neutral-100">
        {sales.map((sale) => {
          const row = (
            <div className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-neutral-50">
              <div className="flex min-w-0 gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                    KIND_STYLES[sale.kind],
                  )}
                >
                  {iconFor(sale.kind)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-neutral-800">
                    {sale.title}
                  </p>
                  <p className="mt-0.5 truncate text-[10.5px] text-neutral-500">
                    {sale.partyName ?? sale.subtitle ?? KIND_LABELS[sale.kind]}
                  </p>
                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    {new Date(sale.occurredAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-right text-[12px] font-bold tabular-nums text-neutral-900">
                {fmt(sale.amount)}
              </p>
            </div>
          );
          return sale.href ? (
            <Link key={sale.id} to={sale.href}>
              {row}
            </Link>
          ) : (
            <div key={sale.id}>{row}</div>
          );
        })}
        {sales.length === 0 && (
          <p className="px-4 py-8 text-center text-[12px] text-neutral-500">
            Aucune vente récente.
          </p>
        )}
      </div>
    </section>
  );
}
