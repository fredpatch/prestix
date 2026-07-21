import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
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
import { useCreateStockArticleMutation } from "@/hooks/mutations/useCreateStockArticle";

const stockArticleSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  unit: z.string().optional(),
  sellingPrice: z
    .number({ invalid_type_error: "Requis." })
    .positive("Le prix de vente doit être supérieur à 0."),
  supplierPrice: z.number().min(0).optional(),
  minLevel: z.number().min(0).optional(),
});

type StockArticleFormValues = z.infer<typeof stockArticleSchema>;

const STOCK_ARTICLE_DEFAULTS: StockArticleFormValues = {
  name: "",
  unit: "unit",
  sellingPrice: 0,
  supplierPrice: 0,
  minLevel: 0,
};

interface CreateStockArticleDialogProps {
  onCreated: () => void;
}

export function CreateStockArticleDialog({ onCreated }: CreateStockArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateStockArticleMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<StockArticleFormValues>({
    resolver: zodResolver(stockArticleSchema),
    defaultValues: STOCK_ARTICLE_DEFAULTS,
  });

  async function onSubmit(values: StockArticleFormValues) {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        unit: values.unit || undefined,
        defaultSellingPrice: values.sellingPrice,
        defaultSupplierPrice: values.supplierPrice,
        minLevel: values.minLevel,
      });
      toast.success("Article créé.");
      setOpen(false);
      reset(STOCK_ARTICLE_DEFAULTS);
      onCreated();
    } catch {
      // Error toast already handled by the global mutation default.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset(STOCK_ARTICLE_DEFAULTS);
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">Nom</label>
            <Input {...register("name")} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Unité
              </label>
              <Input {...register("unit")} placeholder="unit, boîte, ramette..." />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Seuil bas
              </label>
              <Input type="number" {...register("minLevel", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Prix de vente par défaut
              </label>
              <Input type="number" {...register("sellingPrice", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Prix fournisseur par défaut
              </label>
              <Input type="number" {...register("supplierPrice", { valueAsNumber: true })} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
