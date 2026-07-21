// packages/client/src/pages/party/components/CreatePartyDialog.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { partySchema, PARTY_DEFAULTS, type PartyFormValues } from "./party-schema";
import { useCreatePartyMutation } from "@/hooks/mutations/useCreateParty";

interface CreatePartyDialogProps {
  onCreated?: () => void;
}

export function CreatePartyDialog({ onCreated }: CreatePartyDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreatePartyMutation();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: PARTY_DEFAULTS,
  });

  const isClient = watch("isClient");
  const isReferrer = watch("isReferrer");

  async function onSubmit(values: PartyFormValues) {
    try {
      await createMutation.mutateAsync({
        fullName: values.fullName,
        code: values.code || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        isClient: values.isClient,
        isReferrer: values.isReferrer,
      });
      toast.success("Partie créée.");
      setOpen(false);
      reset(PARTY_DEFAULTS);
      onCreated?.();
    } catch {
      // Error toast already handled by the global mutation default.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset(PARTY_DEFAULTS);
      }}
    >
      <DialogTrigger>
        <Button size="sm">
          <Plus size={14} /> Nouvelle partie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle partie</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-[12px] text-neutral-800 cursor-pointer">
              <input type="checkbox" {...register("isClient")} className="accent-brand-gold-dark" />
              Client
            </label>
            <label className="flex items-center gap-2 text-[12px] text-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                {...register("isReferrer")}
                className="accent-brand-gold-dark"
              />
              Référent
            </label>
          </div>
          {!isClient && !isReferrer && (
            <p className="text-[10.5px] text-amber-600">
              Une partie doit être au moins client ou référent.
            </p>
          )}

          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Nom complet
            </label>
            <Input {...register("fullName")} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Code (optionnel)
              </label>
              <Input {...register("code")} />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Téléphone
              </label>
              <Input {...register("phone")} />
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Email (optionnel)
            </label>
            <Input {...register("email")} type="email" />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Adresse (optionnel)
            </label>
            <Input {...register("address")} />
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
