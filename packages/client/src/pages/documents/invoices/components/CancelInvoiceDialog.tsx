import { useState } from "react";
import { Loader2, Ban } from "lucide-react";
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
import { invoiceApi } from "@/lib/invoice.api";

interface CancelInvoiceDialogProps {
  invoiceId: number;
  onCancelled: () => void;
}

export function CancelInvoiceDialog({ invoiceId, onCancelled }: CancelInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await invoiceApi.cancel(invoiceId, reason);
      setOpen(false);
      onCancelled();
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
        <Button variant="destructive" size="sm">
          <Ban size={13} /> Annuler la facture
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler la facture</DialogTitle>
          <DialogDescription>
            Action définitive et auditée. Une raison est requise.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Raison
            </label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Retour
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Confirmer l'annulation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
