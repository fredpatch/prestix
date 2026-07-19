import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { commissionCatalogApi, type CommissionType } from "@/lib/commission-catalog.api";
import { commissionApi, type CommissionDetails } from "@/lib/commission.api";
import { PartySelect } from "@/pages/documents/PartySelect";
import { QuickAddPartyDialog } from "@/pages/party/components/QuickAddPartyDialog";
import { CommissionDynamicFields } from "@/components/customs/CommissionDynamicFields";
import type { Party } from "@/lib/party.api";

interface CreateCommissionDialogProps {
  onCreated: () => void;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function CreateCommissionDialog({ onCreated }: CreateCommissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<CommissionType[]>([]);
  const [selectedTypeCode, setSelectedTypeCode] = useState<string>("");
  const [client, setClient] = useState<Party | null>(null);
  const [referrer, setReferrer] = useState<Party | null>(null);
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState(0);
  const [details, setDetails] = useState<CommissionDetails>({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only ACTIVE types are offered — matches the catalog's whole point
  // (super_admin can seed a type and flip it live/inactive without a code
  // change anywhere, including here).
  useEffect(() => {
    if (open) {
      commissionCatalogApi.list().then((res) => setTypes(res.data.filter((t) => t.active)));
    }
  }, [open]);

  const selectedType = types.find((t) => t.code === selectedTypeCode);

  function reset() {
    setSelectedTypeCode("");
    setClient(null);
    setReferrer(null);
    setDate(todayISO());
    setAmount(0);
    setDetails({});
    setNote("");
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await commissionApi.create({
        type: selectedTypeCode,
        clientPartyId: client?.id,
        referrerPartyId: referrer?.id,
        date,
        commissionAmount: amount,
        details,
        note: note || undefined,
      });
      setOpen(false);
      reset();
      onCreated();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de l'enregistrement.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = selectedTypeCode && date && amount > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger>
        <Button size="sm">
          <Plus size={14} /> Nouvelle commission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle commission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select
              value={selectedTypeCode || undefined}
              onValueChange={(v) => {
                setSelectedTypeCode(v);
                setDetails({}); // switching type resets the dynamic fields — different schema entirely
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="— Sélectionner —" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Montant de la commission</Label>
              <Input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Client/référent are optional everywhere — spec: "absent where N/A,
              e.g. Mobile Money". No hardcoded per-type logic here; every type
              gets the same two optional pickers, whether or not it makes
              sense to fill them in for that particular transaction. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Client (optionnel)</Label>
              <PartySelect value={client} onChange={setClient} placeholder="Rechercher un client..." />
              {!client && (
                <div className="mt-1">
                  <QuickAddPartyDialog
                    role="client"
                    onCreated={setClient}
                    trigger={
                      <button type="button" className="text-[10.5px] text-brand-gold-dark hover:underline">
                        + Ajouter rapidement
                      </button>
                    }
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Référent (optionnel)</Label>
              <PartySelect value={referrer} onChange={setReferrer} filterReferrer placeholder="Rechercher un référent..." />
              {!referrer && (
                <div className="mt-1">
                  <QuickAddPartyDialog
                    role="referrer"
                    onCreated={setReferrer}
                    trigger={
                      <button type="button" className="text-[10.5px] text-brand-gold-dark hover:underline">
                        + Ajouter rapidement
                      </button>
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {selectedType?.fieldSchema && (
            <CommissionDynamicFields fieldSchema={selectedType.fieldSchema} values={details} onChange={setDetails} />
          )}

          {/* Universal, not type-specific — this is the "note" common column,
              always available regardless of which type is selected. */}
          <div>
            <Label>Note (optionnel)</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Précision libre — nature de la transaction, destination, contexte..."
              className="flex w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm resize-none"
            />
          </div>

          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
