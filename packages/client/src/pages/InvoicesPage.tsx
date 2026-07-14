import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { invoiceApi, type Invoice } from "@/lib/invoice.api";
import { CreateInvoiceDraftDialog } from "./documents/invoices/components/CreateInvoiceDraftDialog";
import { CreateProformaDialog } from "./documents/proforma/components/CreateProformaDialog";

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    invoiceApi.list().then((res) => {
      setInvoices(res.data);
      setLoading(false);
    });
  }

  useEffect(load, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-brand-gold-dark">Factures</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {invoices.length} facture{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <CreateInvoiceDraftDialog />
          <CreateProformaDialog />
        </div>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Numéro
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Partie
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Total
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Échéance
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="text-[12px] font-medium text-brand-gold-dark hover:underline"
                    >
                      {inv.number ?? `Brouillon #${inv.id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-800">
                    {inv.partySnapshot?.fullName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-800 text-right">
                    {parseFloat(inv.totalAmount).toLocaleString("fr-FR")} XAF
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${STATUS_STYLES[inv.status]}`}
                    >
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                    Aucune facture.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
