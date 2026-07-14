import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { proformaApi, type Proforma } from "@/lib/proforma.api";
import { invoiceApi } from "@/lib/invoice.api";
import { Party, partyApi } from "@/lib/party.api";

const STATUS_LABELS: Record<Proforma["status"], string> = {
  draft: "Valide",
  issued: "Valide",
  expired: "Expiré",
  cancelled: "Annulé",
};

export default function ProformaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proforma, setProforma] = useState<Proforma | null>(null);
  const [referrer, setReferrer] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    proformaApi.getById(parseInt(id!)).then((res) => {
      setProforma(res.data);
      setLoading(false);

      if (res.data.referrerPartyId) {
        partyApi.getById(res.data.referrerPartyId).then((r) => setReferrer(r.data));
      }
    });
  }, [id]);

  async function handlePromote() {
    if (!proforma) return;
    setPromoting(true);
    setError(null);
    try {
      const res = await invoiceApi.promoteFromProforma(proforma.id);
      navigate(`/invoices/${res.data.id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la promotion.",
      );
      setPromoting(false);
    }
  }

  if (loading || !proforma) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  const total = proforma.lines.reduce((sum, l) => sum + parseFloat(l.lineTotal), 0);
  const canPromote = proforma.status === "draft"; // expired/cancelled blocked server-side too

  return (
    <div>
      <Link
        to="/proformas"
        className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-brand-gold-dark mb-4"
      >
        <ArrowLeft size={13} /> Retour aux proformas
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-brand-gold-dark">{proforma.number}</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {proforma.partySnapshot?.fullName} · {STATUS_LABELS[proforma.status]}
            {proforma.expiresAt &&
              ` · expire le ${new Date(proforma.expiresAt).toLocaleString("fr-FR")}`}
            {referrer && ` · référent : ${referrer.fullName}`}
          </p>
        </div>
        {canPromote && (
          <Button size="sm" onClick={handlePromote} disabled={promoting}>
            {promoting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ArrowRightCircle size={13} />
            )}
            Promouvoir en facture
          </Button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-600 mb-3">{error}</p>}

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                Description
              </th>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                Qté
              </th>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                Prix unitaire
              </th>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                Remise
              </th>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {proforma.lines.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2.5 text-[12px] text-neutral-800">{l.description}</td>
                <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">
                  {l.quantity}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">
                  {parseFloat(l.unitPrice).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">
                  {parseFloat(l.discount) > 0
                    ? `-${parseFloat(l.discount).toLocaleString("fr-FR")}`
                    : "—"}
                </td>
                <td className="px-4 py-2.5 text-[12px] font-medium text-neutral-800 text-right">
                  {parseFloat(l.lineTotal).toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50">
              <td
                colSpan={4}
                className="px-4 py-2.5 text-[12px] font-semibold text-neutral-800 text-right"
              >
                Total
              </td>
              <td className="px-4 py-2.5 text-[13px] font-bold text-brand-gold-dark text-right">
                {total.toLocaleString("fr-FR")} XAF
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
