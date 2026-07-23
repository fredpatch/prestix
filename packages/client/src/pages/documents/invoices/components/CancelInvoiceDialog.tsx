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
import { useCancelInvoiceMutation } from "@/hooks/mutations/useCancelInvoice";

interface CancelInvoiceDialogProps {
  invoiceId: number;
  onCancelled: () => void;
}

export function CancelInvoiceDialog({ invoiceId, onCancelled }: CancelInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const cancelMutation = useCancelInvoiceMutation(invoiceId);

  function handleSubmit() {
    cancelMutation.mutate(reason, {
      onSuccess: () => {
        setOpen(false);
        onCancelled();
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setReason("");
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
            <label className="block text-[11.5px] font-medium text-body mb-1.5">
              Raison
            </label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Retour
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={cancelMutation.isPending || !reason.trim()}
          >
            {cancelMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : "Confirmer l'annulation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
