import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
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
import { savingsApi, type SavingsAccount } from "@/lib/savings.api";
import { useAuth } from "@/App";

interface SavingsTransactionDialogProps {
  account: SavingsAccount;
  onRecorded: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_EPARGNE_BALANCE: "Solde insuffisant pour ce retrait.",
  SAVINGS_AMOUNT_MUST_BE_POSITIVE: "Le montant doit être supérieur à zéro.",
};

export function SavingsTransactionDialog({ account, onRecorded }: SavingsTransactionDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [nature, setNature] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Withdrawal is manager+ per spec — deposits are open to any agent.
  const canWithdraw = user && ["manager", "admin", "super_admin"].includes(user.role);

  function reset() {
    setNature("deposit");
    setAmount(0);
    setQuantity(1);
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (nature === "deposit") {
        await savingsApi.deposit(account.id, amount, quantity);
      } else {
        await savingsApi.withdraw(account.id, amount, quantity);
      }
      setOpen(false);
      reset();
      onRecorded();
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      setError((code && ERROR_MESSAGES[code]) ?? "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  }

  const total = amount * quantity;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger>
        <Button variant="outline" size="sm">
          <Wallet size={13} /> Dépôt / Retrait
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mouvement épargne</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-[11.5px] text-neutral-500">
            Solde actuel : <span className="font-medium text-neutral-800">{parseFloat(account.balance).toLocaleString("fr-FR")} XAF</span>
          </p>

          <div className="grid grid-cols-2 rounded-lg border border-neutral-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setNature("deposit")}
              className={`px-3 py-2 text-[12px] font-medium ${nature === "deposit" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
            >
              Dépôt
            </button>
            <button
              type="button"
              onClick={() => canWithdraw && setNature("withdraw")}
              disabled={!canWithdraw}
              className={`px-3 py-2 text-[12px] font-medium ${nature === "withdraw" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"} ${!canWithdraw ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              Retrait
            </button>
          </div>
          {nature === "withdraw" && !canWithdraw && (
            <p className="text-[10.5px] text-amber-600">Le retrait nécessite un rôle manager ou supérieur.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">Montant unitaire</label>
              <Input type="number" value={amount || ""} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">Quantité</label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min={1} />
            </div>
          </div>
          {quantity > 1 && (
            <p className="text-[10.5px] text-neutral-500">Total : {total.toLocaleString("fr-FR")} XAF</p>
          )}

          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || amount <= 0 || (nature === "withdraw" && !canWithdraw)}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
