import { useState } from "react";
import { Loader2, Undo2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savingsApi } from "@/lib/savings.api";

interface ReverseSavingsTransactionDialogProps {
  transactionId: number;
  onReversed: () => void;
}

// admin+ (route-gated server-side, same bar as invoice cancellation) — the
// ONLY correction mechanism for a recorded transaction. Creates a
// compensating entry, never touches the original row.
export function ReverseSavingsTransactionDialog({
  transactionId,
  onReversed,
}: ReverseSavingsTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await savingsApi.reverse(transactionId, reason);
      setOpen(false);
      setReason("");
      onReversed();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de l'annulation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setReason("");
          setError(null);
        }
      }}
    >
      <DialogTrigger>
        <Button variant="ghost" size="icon" title="Annuler (contre-passation)">
          <Undo2 size={13} className="text-red-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler ce mouvement</DialogTitle>
          <DialogDescription>
            Crée une écriture inverse — le mouvement original reste visible et n'est jamais modifié.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">Raison</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Retour
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason.trim()}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Confirmer l'annulation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
