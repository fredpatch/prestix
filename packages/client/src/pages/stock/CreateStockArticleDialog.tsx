import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { stockApi } from "@/lib/stock.api";

interface CreateStockArticleDialogProps {
  onCreated: () => void;
}

export function CreateStockArticleDialog({ onCreated }: CreateStockArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("unit");
  const [sellingPrice, setSellingPrice] = useState(0);
  const [supplierPrice, setSupplierPrice] = useState(0);
  const [minLevel, setMinLevel] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setUnit("unit");
    setSellingPrice(0);
    setSupplierPrice(0);
    setMinLevel(0);
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await stockApi.create({
        name,
        unit,
        defaultSellingPrice: sellingPrice,
        defaultSupplierPrice: supplierPrice,
        minLevel,
      });
      setOpen(false);
      reset();
      onCreated();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la création.",
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
        if (!v) reset();
      }}
    >
      <DialogTrigger>
        <Button size="sm">
          <Plus size={14} /> Nouvel article
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel article de stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">Nom</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Unité
              </label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="unit, boîte, ramette..."
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Seuil bas
              </label>
              <Input
                type="number"
                value={minLevel}
                onChange={(e) => setMinLevel(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Prix de vente par défaut
              </label>
              <Input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Prix fournisseur par défaut
              </label>
              <Input
                type="number"
                value={supplierPrice}
                onChange={(e) => setSupplierPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name || sellingPrice <= 0}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
