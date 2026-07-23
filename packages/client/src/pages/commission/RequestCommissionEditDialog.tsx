import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import { type CommissionTransaction } from "@/lib/commission.api";
import { DatePicker } from "@/components/ui/date-picker";
import { useRequestCommissionEditMutation } from "@/hooks/mutations/useRequestCommissionEdit";

interface RequestCommissionEditDialogProps {
  commission: CommissionTransaction;
  onRequested: () => void;
}

// Scoped to the three most common correction targets (date, amount, note) —
// not a generic editor for every field. Client/référent and the type-specific
// dynamic fields would need extra context (re-fetching the type's
// fieldSchema) to edit safely here; deliberately left out of this first pass
// rather than built half-right.
export function RequestCommissionEditDialog({ commission, onRequested }: RequestCommissionEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(commission.date.split("T")[0]);
  const [amount, setAmount] = useState(parseFloat(commission.commissionAmount));
  const [note, setNote] = useState(commission.note ?? "");
  const [reason, setReason] = useState("");
  const requestMutation = useRequestCommissionEditMutation();

  function reset() {
    setDate(commission.date.split("T")[0]);
    setAmount(parseFloat(commission.commissionAmount));
    setNote(commission.note ?? "");
    setReason("");
  }

  function handleSubmit() {
    // Only send fields that actually changed — a proposed "change" that's
    // identical to the current value is just noise for the reviewer. This
    // is a pre-submit form-shape check, not an API failure, so it stays a
    // direct toast rather than going through the mutation's error path.
    const proposedChanges: Record<string, unknown> = {};
    if (date !== commission.date.split("T")[0]) proposedChanges.date = date;
    if (amount !== parseFloat(commission.commissionAmount)) proposedChanges.commissionAmount = amount;
    if (note !== (commission.note ?? "")) proposedChanges.note = note || null;

    if (Object.keys(proposedChanges).length === 0) {
      toast.error("Aucun changement détecté.");
      return;
    }

    requestMutation.mutate(
      { commissionId: commission.id, reason, proposedChanges },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          onRequested();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger>
        <Button variant="ghost" size="icon" title="Demander une modification">
          <Pencil size={13} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demander une modification</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Cette demande sera soumise à validation — la commission ne changera qu'après approbation
            par un administrateur.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div>
              <Label>Montant</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <Label>Note</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="flex w-full rounded border border-border bg-card px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <Label>Raison de la modification (obligatoire)</Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Pourquoi ce changement est-il nécessaire ?"
              className="flex w-full rounded border border-border bg-card px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={requestMutation.isPending || !reason.trim()}>
            {requestMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : "Soumettre la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
