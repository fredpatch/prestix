import { useState, useEffect } from "react";
import { Loader2, Banknote } from "lucide-react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { paymentApi, type Installment, type RecordPaymentInput } from "@/lib/payment.api";

interface RecordPaymentDialogProps {
  invoiceId: number;
  onRecorded: () => void;
}

const METHODS: { value: RecordPaymentInput["method"]; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "virement", label: "Virement" },
  { value: "credit", label: "Crédit / Avoir" },
  { value: "epargne", label: "Épargne voyage" },
];

export function RecordPaymentDialog({ invoiceId, onRecorded }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<RecordPaymentInput["method"]>("cash");
  const [target, setTarget] = useState<string>("fifo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overpaymentPending, setOverpaymentPending] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      paymentApi.listInstallments(invoiceId).then((res) => setInstallments(res.data));
    }
  }, [open, invoiceId]);

  function reset() {
    setAmount(0);
    setMethod("cash");
    setTarget("fifo");
    setError(null);
    setOverpaymentPending(null);
  }

  const openInstallments = installments.filter((i) => i.status !== "paid");

  async function submit(overpaymentChoice?: "change" | "credit") {
    setSubmitting(true);
    setError(null);
    try {
      await paymentApi.record(invoiceId, {
        amountTendered: amount,
        method,
        targetInstallmentId: target !== "fifo" ? parseInt(target) : undefined,
        overpaymentChoice,
      });
      setOpen(false);
      reset();
      onRecorded();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; code?: string } } })?.response
        ?.data;
      if (data?.code === "OVERPAYMENT_CHOICE_REQUIRED") {
        setOverpaymentPending(amount);
      } else {
        setError(data?.message ?? "Erreur lors de l'enregistrement.");
      }
    } finally {
      setSubmitting(false);
    }
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
        <Button size="sm" variant="outline">
          <Banknote size={13} /> Enregistrer un paiement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
        </DialogHeader>

        {overpaymentPending !== null ? (
          <div className="space-y-3">
            <p className="text-[12px] text-neutral-800">
              Ce montant dépasse le solde dû. Que faire de l'excédent ?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => submit("change")}
                disabled={submitting}
              >
                Rendre la monnaie
              </Button>
              <Button className="flex-1" onClick={() => submit("credit")} disabled={submitting}>
                Créditer le compte
              </Button>
            </div>
            {submitting && <Loader2 size={13} className="animate-spin mx-auto" />}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Montant reçu
                </label>
                <Input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Méthode
                </label>
                <Select
                  value={method}
                  onValueChange={(v) => setMethod(v as RecordPaymentInput["method"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Échéance ciblée (optionnel)
                </label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fifo">FIFO automatique (plus ancienne d'abord)</SelectItem>
                    {openInstallments.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>
                        Échéance {i.sequence} — reste{" "}
                        {(parseFloat(i.expectedAmount) - parseFloat(i.paidAmount)).toLocaleString(
                          "fr-FR",
                        )}{" "}
                        XAF
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-[11px] text-red-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => submit()} disabled={submitting || amount <= 0}>
                {submitting ? <Loader2 size={13} className="animate-spin" /> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
