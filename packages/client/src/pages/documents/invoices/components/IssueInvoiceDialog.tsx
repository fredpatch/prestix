import { useState } from "react";
import { Loader2, Send, Plus, Trash2 } from "lucide-react";
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
import { useAuth } from "@/App";
import { useIssueInvoiceMutation } from "@/hooks/mutations/useIssueInvoice";

interface IssueInvoiceDialogProps {
  invoiceId: number;
  totalAmount: number;
  onIssued: () => void;
}

interface InstallmentDraft {
  expectedDate: string;
  expectedAmount: number;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function IssueInvoiceDialog({ invoiceId, totalAmount, onIssued }: IssueInvoiceDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"full" | "installments">("full");
  // échéance 1 (avance) always starts today, per M5 spec — not editable by the agent.
  const [installments, setInstallments] = useState<InstallmentDraft[]>([
    { expectedDate: todayISO(), expectedAmount: totalAmount },
  ]);
  const [stockOverridePending, setStockOverridePending] = useState(false);

  const canOverrideStock = user && ["manager", "admin", "super_admin"].includes(user.role);

  const issueMutation = useIssueInvoiceMutation(invoiceId, !!canOverrideStock, () =>
    setStockOverridePending(true),
  );

  function reset() {
    setMode("full");
    setInstallments([{ expectedDate: todayISO(), expectedAmount: totalAmount }]);
    setStockOverridePending(false);
  }

  function addInstallment() {
    if (installments.length >= 3) return;
    setInstallments([...installments, { expectedDate: "", expectedAmount: 0 }]);
  }

  function updateInstallment(index: number, patch: Partial<InstallmentDraft>) {
    setInstallments(installments.map((inst, i) => (i === index ? { ...inst, ...patch } : inst)));
  }

  function removeInstallment(index: number) {
    if (index === 0) return; // échéance 1 (avance) can't be removed
    setInstallments(installments.filter((_, i) => i !== index));
  }

  const sum = installments.reduce((s, i) => s + (i.expectedAmount || 0), 0);
  const sumMatches = Math.round(sum) === Math.round(totalAmount);
  const datesValid = mode === "full" || installments.every((i) => i.expectedDate);
  const canSubmit = mode === "full" || (sumMatches && datesValid);

  function handleSubmit(allowNegativeStockOverride = false) {
    issueMutation.mutate(
      {
        requestId: crypto.randomUUID(),
        paymentPlan: { mode, installments: mode === "installments" ? installments : undefined },
        allowNegativeStockOverride,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          onIssued();
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
        <Button size="sm">
          <Send size={13} /> Émettre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Émettre la facture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("full")}
              className={`px-3 py-2 text-[12px] font-medium ${mode === "full" ? "bg-brand-gold-dark text-white" : "bg-card text-muted-foreground"}`}
            >
              Paiement complet
            </button>
            <button
              type="button"
              onClick={() => setMode("installments")}
              className={`px-3 py-2 text-[12px] font-medium ${mode === "installments" ? "bg-brand-gold-dark text-white" : "bg-card text-muted-foreground"}`}
            >
              Échéancier (≤3)
            </button>
          </div>

          {mode === "full" ? (
            <p className="text-[11.5px] text-muted-foreground">
              Un seul paiement attendu de {totalAmount.toLocaleString("fr-FR")} XAF, échéance
              calculée automatiquement.
            </p>
          ) : (
            <div className="space-y-2">
              {installments.map((inst, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-center bg-surface-muted rounded-lg p-2.5"
                >
                  <span className="col-span-1 text-[11px] font-medium text-muted-foreground">
                    #{i + 1}
                  </span>
                  <Input
                    type="date"
                    value={inst.expectedDate}
                    onChange={(e) => updateInstallment(i, { expectedDate: e.target.value })}
                    disabled={i === 0}
                    className="col-span-5 h-9 text-[12px]"
                  />
                  <Input
                    type="number"
                    placeholder="Montant"
                    value={inst.expectedAmount || ""}
                    onChange={(e) =>
                      updateInstallment(i, { expectedAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="col-span-4 h-9 text-[12px]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInstallment(i)}
                    disabled={i === 0}
                    className="col-span-2 text-danger-text hover:bg-danger-bg disabled:opacity-30"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
              {installments.length < 3 && (
                <Button variant="outline" size="sm" onClick={addInstallment}>
                  <Plus size={13} /> Ajouter une échéance
                </Button>
              )}
              <div className="flex justify-between text-[11.5px] pt-1">
                <span className={sumMatches ? "text-success-text" : "text-danger-text"}>
                  Total échéancier : {sum.toLocaleString("fr-FR")} XAF
                </span>
                <span className="text-muted-foreground">
                  Facture : {totalAmount.toLocaleString("fr-FR")} XAF
                </span>
              </div>
              {!sumMatches && (
                <p className="text-[10.5px] text-danger-text">
                  La somme des échéances doit égaler le total de la facture.
                </p>
              )}
            </div>
          )}

          {stockOverridePending && (
            <div className="border border-warning-border bg-warning-bg rounded-lg p-3 space-y-2">
              <p className="text-[12px] text-warning-text">
                Stock insuffisant pour au moins un article. En tant que manager, vous pouvez forcer
                l'émission - cela enregistrera un mouvement de stock négatif, audité.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStockOverridePending(false)}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmit(true)}
                  disabled={issueMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {issueMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    "Forcer l'émission"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={issueMutation.isPending || !canSubmit || stockOverridePending}
          >
            {issueMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : "Confirmer l'émission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
