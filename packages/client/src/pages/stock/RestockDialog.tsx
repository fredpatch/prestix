import { useState } from "react";
import { Loader2, PackagePlus } from "lucide-react";
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
import { stockApi, type StockArticle } from "@/lib/stock.api";

interface RestockDialogProps {
  article: StockArticle;
  onDone: () => void;
}

export function RestockDialog({ article, onDone }: RestockDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"IN" | "ADJUST">("IN");
  const [quantity, setQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await stockApi.restock(article.id, type, type === "IN" ? Math.abs(quantity) : quantity);
      setOpen(false);
      setQuantity(0);
      onDone();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur — vérifiez que la quantité ne fait pas passer le stock sous zéro.",
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
          setQuantity(0);
          setError(null);
        }
      }}
    >
      <DialogTrigger>
        <Button variant="ghost" size="icon" title="Réapprovisionner">
          <PackagePlus size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réapprovisionner — {article.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-[11.5px] text-neutral-500">
            Stock actuel : {article.onHand} {article.unit}
          </p>
          <div className="grid grid-cols-2 rounded-lg border border-neutral-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setType("IN")}
              className={`px-3 py-2 text-[12px] font-medium ${type === "IN" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
            >
              Entrée (réappro)
            </button>
            <button
              type="button"
              onClick={() => setType("ADJUST")}
              className={`px-3 py-2 text-[12px] font-medium ${type === "ADJUST" ? "bg-brand-gold-dark text-white" : "bg-white text-neutral-500"}`}
            >
              Ajustement
            </button>
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              {type === "IN" ? "Quantité reçue" : "Ajustement (+/-)"}
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            />
            {type === "ADJUST" && (
              <p className="text-[10.5px] text-neutral-500 mt-1">
                Négatif pour retirer, positif pour ajouter.
              </p>
            )}
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || quantity === 0}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
