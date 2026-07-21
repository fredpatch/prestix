import { useState } from "react";
import { Loader2, Wallet, AlertTriangle } from "lucide-react";
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
import { type SavingsAccount } from "@/lib/savings.api";
import { useAuth } from "@/App";
import { useSavingsTransactionMutation } from "@/hooks/mutations/useSavingsTransaction";

interface SavingsTransactionDialogProps {
  account: SavingsAccount;
  onRecorded: () => void;
}

export function SavingsTransactionDialog({ account, onRecorded }: SavingsTransactionDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [nature, setNature] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState(0);
  const transactionMutation = useSavingsTransactionMutation(account.partyId);

  // Withdrawal is admin+ (confirmed correction from Fred): money normally
  // only leaves an épargne account by being spent — a ticket or shop
  // purchase via épargne-as-payment (M5 integration), never withdrawn as
  // cash on demand. This dialog's "Retrait" option is deliberately framed as
  // an exceptional override for special cases, not a routine peer of Dépôt.
  const canWithdraw = user && ["admin", "super_admin"].includes(user.role);

  function reset() {
    setNature("deposit");
    setAmount(0);
  }

  function handleSubmit() {
    transactionMutation.mutate(
      { accountId: account.id, nature, amount },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          onRecorded();
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
        <Button variant="outline" size="sm">
          <Wallet size={13} /> Dépôt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mouvement épargne</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-[11.5px] text-neutral-500">
            Solde actuel :{" "}
            <span className="font-medium text-neutral-800">
              {parseFloat(account.balance).toLocaleString("fr-FR")} XAF
            </span>
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
              className={`px-3 py-2 text-[12px] font-medium ${nature === "withdraw" ? "bg-red-600 text-white" : "bg-white text-neutral-500"} ${!canWithdraw ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              Retrait exceptionnel
            </button>
          </div>

          {nature === "withdraw" && !canWithdraw && (
            <p className="text-[10.5px] text-amber-600">
              Le retrait direct nécessite un rôle admin. En temps normal, l'épargne se dépense sur un
              billet ou un article — jamais retirée en espèces.
            </p>
          )}
          {nature === "withdraw" && canWithdraw && (
            <div className="flex items-start gap-1.5 text-[10.5px] text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>
                Retrait direct exceptionnel — l'épargne ne devrait normalement jamais sortir en espèces,
                seulement être dépensée sur un billet ou un article.
              </span>
            </div>
          )}

          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">Montant</label>
            <Input type="number" value={amount || ""} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={transactionMutation.isPending || amount <= 0 || (nature === "withdraw" && !canWithdraw)}
            variant={nature === "withdraw" ? "destructive" : "default"}
          >
            {transactionMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
