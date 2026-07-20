import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Banknote, AlertTriangle } from "lucide-react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { paymentApi, type Installment, type RecordPaymentInput } from "@/lib/payment.api";
import { getApiErrorMessage, getApiErrorCode } from "@/lib/api-error";

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

const paymentSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Montant requis." })
    .positive("Le montant doit être supérieur à 0."),
  method: z.enum(["cash", "mobile_money", "virement", "credit", "epargne"]),
  target: z.string(),
  allocationTarget: z.enum(["principal", "penalty"]),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const PAYMENT_DEFAULTS: PaymentFormValues = {
  amount: 0,
  method: "cash",
  target: "fifo",
  allocationTarget: "principal",
};

export function RecordPaymentDialog({ invoiceId, onRecorded }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [overpaymentPending, setOverpaymentPending] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: PAYMENT_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      paymentApi.listInstallments(invoiceId).then((res) => setInstallments(res.data));
    }
  }, [open, invoiceId]);

  const openInstallments = installments.filter((i) => i.status !== "paid");
  const anyPenaltyDue = installments.some((i) => parseFloat(i.penaltyDue) > 0);
  const allocationTarget = watch("allocationTarget");

  async function doSubmit(values: PaymentFormValues, overpaymentChoice?: "change" | "credit") {
    try {
      await paymentApi.record(invoiceId, {
        amountTendered: values.amount,
        method: values.method,
        targetInstallmentId: values.target !== "fifo" ? parseInt(values.target) : undefined,
        overpaymentChoice,
        allocationTarget: values.allocationTarget,
      });
      setOpen(false);
      reset(PAYMENT_DEFAULTS);
      setOverpaymentPending(null);
      onRecorded();
    } catch (err) {
      if (getApiErrorCode(err) === "OVERPAYMENT_CHOICE_REQUIRED") {
        setOverpaymentPending(values.amount);
      } else {
        toast.error(getApiErrorMessage(err, "Erreur lors de l'enregistrement."));
      }
    }
  }

  async function resolveOverpayment(choice: "change" | "credit") {
    setResolving(true);
    await doSubmit(getValues(), choice);
    setResolving(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          reset(PAYMENT_DEFAULTS);
          setOverpaymentPending(null);
        }
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
                onClick={() => resolveOverpayment("change")}
                disabled={resolving}
              >
                Rendre la monnaie
              </Button>
              <Button
                className="flex-1"
                onClick={() => resolveOverpayment("credit")}
                disabled={resolving}
              >
                Créditer le compte
              </Button>
            </div>
            {resolving && <Loader2 size={13} className="animate-spin mx-auto" />}
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => doSubmit(values))}>
            <div className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Montant reçu
                </label>
                <Input
                  type="number"
                  {...register("amount", { valueAsNumber: true })}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Méthode
                </label>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Échéance ciblée (optionnel)
                </label>
                <Controller
                  control={control}
                  name="target"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fifo">
                          FIFO automatique (plus ancienne d'abord)
                        </SelectItem>
                        {openInstallments.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)}>
                            Échéance {i.sequence} — reste{" "}
                            {(
                              parseFloat(i.expectedAmount) - parseFloat(i.paidAmount)
                            ).toLocaleString("fr-FR")}{" "}
                            XAF
                            {parseFloat(i.penaltyDue) > 0 &&
                              ` (+ pénalité ${parseFloat(i.penaltyDue).toLocaleString("fr-FR")} XAF)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {anyPenaltyDue && (
                <div>
                  <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                    Allouer en priorité à
                  </label>
                  <div className="grid grid-cols-2 rounded-lg border border-neutral-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setValue("allocationTarget", "principal")}
                      className={`px-3 py-2 text-[12px] font-medium ${allocationTarget === "principal" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("allocationTarget", "penalty")}
                      className={`px-3 py-2 text-[12px] font-medium ${allocationTarget === "penalty" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
                    >
                      Pénalité
                    </button>
                  </div>
                  {allocationTarget === "penalty" && (
                    <p className="flex items-start gap-1.5 text-[10.5px] text-amber-600 mt-1.5">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      <span>
                        Le principal restera dû et l'accumulation de pénalité continuera tant
                        qu'il n'est pas réglé.
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
