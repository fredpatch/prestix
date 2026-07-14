import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { proformaApi, type Proforma } from "@/lib/proforma.api";
import { CreateProformaDialog } from "./documents/proforma/components/CreateProformaDialog";

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

export default function ProformasPage() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    proformaApi.list().then((res) => {
      setProformas(res.data);
      setLoading(false);
    });
  }

  useEffect(load, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-brand-gold-dark">Proformas</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {proformas.length} proforma{proformas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateProformaDialog />
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
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Créé le
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Expire le
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {proformas.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/proformas/${p.id}`}
                      className="text-[12px] font-medium text-brand-gold-dark hover:underline"
                    >
                      {p.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-800">
                    {p.partySnapshot?.fullName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">
                    {p.expiresAt ? new Date(p.expiresAt).toLocaleString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${STATUS_STYLES[p.status]}`}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {proformas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                    Aucun proforma.
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
