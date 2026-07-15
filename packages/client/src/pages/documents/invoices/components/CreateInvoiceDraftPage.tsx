import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PartySelect } from "@/pages/documents/PartySelect";
import { invoiceApi } from "@/lib/invoice.api";
import type { DocumentLineInput } from "@/lib/proforma.api";
import type { Party } from "@/lib/party.api";
import { LineItemsBuilder } from "@/components/customs/LineItemsBuilder";

export default function CreateInvoiceDraftPage() {
  const navigate = useNavigate();
  const [party, setParty] = useState<Party | null>(null);
  const [referrer, setReferrer] = useState<Party | null>(null);
  const [lines, setLines] = useState<DocumentLineInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!party) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await invoiceApi.createDraft(party.id, lines, referrer?.id);
      navigate(`/invoices/${res.data.id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la création.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    party &&
    lines.length > 0 &&
    lines.every((l) =>
      l.lineType === "ticket"
        ? l.ticketDetails?.passengerName && l.ticketDetails?.references?.pnr && l.unitPrice > 0
        : l.description && l.unitPrice > 0,
    );

  return (
    <div className="max-w-3xl">
      <Link
        to="/invoices"
        className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-brand-gold-dark mb-4"
      >
        <ArrowLeft size={13} /> Retour aux factures
      </Link>

      <h1 className="text-lg font-bold text-brand-gold-dark mb-6">Nouvelle facture (brouillon)</h1>

      <div className="space-y-5">
        <div>
          <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">Partie</label>
          <PartySelect value={party} onChange={setParty} />
        </div>
        <div>
          <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
            Référent (optionnel)
          </label>
          <PartySelect
            value={referrer}
            onChange={setReferrer}
            filterReferrer
            placeholder="Rechercher un référent..."
          />
        </div>
        <div>
          <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">Lignes</label>
          <LineItemsBuilder lines={lines} onChange={setLines} />
        </div>
        {error && <p className="text-[11px] text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => navigate("/invoices")}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Créer le brouillon"}
          </Button>
        </div>
      </div>
    </div>
  );
}
