import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { creanceApi, type CreanceRow } from "@/lib/creance.api";

export default function CreancesPage() {
  const [rows, setRows] = useState<CreanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyOverdue, setOnlyOverdue] = useState(true);

  useEffect(() => {
    setLoading(true);
    creanceApi.list(onlyOverdue).then((res) => {
      setRows(res.data);
      setLoading(false);
    });
  }, [onlyOverdue]);

  const totalPrincipal = rows.reduce((sum, r) => sum + parseFloat(r.principalDue), 0);
  const totalPenalty = rows.reduce((sum, r) => sum + parseFloat(r.penaltyDue), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-brand-gold-dark">Créances</h1>
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

      {loading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Facture
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Client
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Échéance
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Principal dû
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Pénalité due
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.installmentId}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/invoices/${r.invoiceId}`}
                      className="text-[12px] font-medium text-brand-gold-dark hover:underline"
                    >
                      {r.invoiceNumber ?? `#${r.invoiceId}`}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-800">{r.partyName}</td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">
                    #{r.sequence} — {new Date(r.expectedDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-800 text-right">
                    {parseFloat(r.principalDue).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-right">
                    {parseFloat(r.penaltyDue) > 0 ? (
                      <span className="text-red-600 font-medium">
                        {parseFloat(r.penaltyDue).toLocaleString("fr-FR")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                        r.isOverdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.isOverdue ? "En retard" : "Impayée"}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                    Aucune créance.
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
