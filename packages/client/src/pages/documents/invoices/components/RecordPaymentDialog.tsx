import { useState, useEffect } from "react";
import { Loader2, Banknote, AlertTriangle } from "lucide-react";
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
  const [allocationTarget, setAllocationTarget] = useState<"principal" | "penalty">("principal");
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
    setAllocationTarget("principal");
    setError(null);
    setOverpaymentPending(null);
  }

  const openInstallments = installments.filter((i) => i.status !== "paid");
  const anyPenaltyDue = installments.some((i) => parseFloat(i.penaltyDue) > 0);

  async function submit(overpaymentChoice?: "change" | "credit") {
    setSubmitting(true);
    setError(null);
    try {
      await paymentApi.record(invoiceId, {
        amountTendered: amount,
        method,
        targetInstallmentId: target !== "fifo" ? parseInt(target) : undefined,
        overpaymentChoice,
        allocationTarget,
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
                        {parseFloat(i.penaltyDue) > 0 &&
                          ` (+ pénalité ${parseFloat(i.penaltyDue).toLocaleString("fr-FR")} XAF)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {anyPenaltyDue && (
                <div>
                  <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                    Allouer en priorité à
                  </label>
                  <div className="grid grid-cols-2 rounded-lg border border-neutral-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAllocationTarget("principal")}
                      className={`px-3 py-2 text-[12px] font-medium ${allocationTarget === "principal" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocationTarget("penalty")}
                      className={`px-3 py-2 text-[12px] font-medium ${allocationTarget === "penalty" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
                    >
                      Pénalité
                    </button>
                  </div>
                  {allocationTarget === "penalty" && (
                    <p className="flex items-start gap-1.5 text-[10.5px] text-amber-600 mt-1.5">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      <span>
                        Le principal restera dû et l'accumulation de pénalité continuera tant qu'il
                        n'est pas réglé.
                      </span>
                    </p>
                  )}
                </div>
              )}
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
