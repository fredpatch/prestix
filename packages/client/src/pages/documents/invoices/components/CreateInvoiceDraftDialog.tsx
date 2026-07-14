import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartySelect } from "@/pages/documents/PartySelect";
import { invoiceApi } from "@/lib/invoice.api";
import type { DocumentLineInput } from "@/lib/proforma.api";
import type { Party } from "@/lib/party.api";
import { LineItemsBuilder } from "@/components/customs/LineItemsBuilder";

export function CreateInvoiceDraftDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [party, setParty] = useState<Party | null>(null);
  const [lines, setLines] = useState<DocumentLineInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setParty(null);
    setLines([]);
    setError(null);
  }

  async function handleSubmit() {
    if (!party) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await invoiceApi.createDraft(party.id, lines);
      setOpen(false);
      reset();
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
    party && lines.length > 0 && lines.every((l) => l.description && l.unitPrice > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger>
        <Button size="sm" variant="outline">
          <Plus size={14} /> Facture directe (sans proforma)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle facture (brouillon)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Partie
            </label>
            <PartySelect value={party} onChange={setParty} />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Lignes
            </label>
            <LineItemsBuilder lines={lines} onChange={setLines} />
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Créer le brouillon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
