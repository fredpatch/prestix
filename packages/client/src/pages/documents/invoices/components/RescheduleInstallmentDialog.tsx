import { useState } from "react";
import { Loader2, CalendarClock } from "lucide-react";
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
import { paymentApi, type Installment } from "@/lib/payment.api";

interface RescheduleInstallmentDialogProps {
  installment: Installment;
  onRescheduled: () => void;
}

export function RescheduleInstallmentDialog({
  installment,
  onRescheduled,
}: RescheduleInstallmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await paymentApi.reschedule(installment.id, newDate, reason);
      setOpen(false);
      setNewDate("");
      setReason("");
      onRescheduled();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="ghost"
          size="icon"
          title="Reprogrammer"
          className="text-neutral-500 hover:text-brand-gold-dark"
        >
          <CalendarClock size={13} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reprogrammer l'échéance {installment.sequence}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-[11px] text-neutral-500">
            Date actuelle : {new Date(installment.expectedDate).toLocaleDateString("fr-FR")}. La
            nouvelle date doit être ultérieure.
          </p>
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Nouvelle date
            </label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={installment.expectedDate}
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Raison
            </label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !newDate || !reason.trim()}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
