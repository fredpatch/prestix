import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Party } from "@/lib/party.api";
import {
  partySchema,
  PARTY_DEFAULTS,
  partyToValues,
  type PartyFormValues,
} from "./components/party-schema";
import { useUpdatePartyMutation } from "@/hooks/mutations/useUpdateParty";

interface EditPartyDialogProps {
  party: Party | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditPartyDialog({ party, onClose, onUpdated }: EditPartyDialogProps) {
  const updateMutation = useUpdatePartyMutation();

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

  useEffect(() => {
    if (party) reset(partyToValues(party));
  }, [party, reset]);

  const isClient = watch("isClient");
  const isReferrer = watch("isReferrer");
  const partyType = watch("partyType");

  async function onSubmit(values: PartyFormValues) {
    if (!party) return;
    try {
      await updateMutation.mutateAsync({
        id: party.id,
        data: {
          fullName: values.fullName,
          code: values.code || undefined,
          partyType: values.partyType,
          tradeName: values.partyType === "company" ? values.tradeName || undefined : undefined,
          taxId: values.partyType === "company" ? values.taxId || undefined : undefined,
          phone: values.phone || undefined,
          email: values.email || undefined,
          address: values.address || undefined,
          isClient: values.isClient,
          isReferrer: values.isReferrer,
        },
      });
      toast.success("Partie modifiée.");
      onUpdated();
      onClose();
    } catch {
      // Error toast already handled by the global mutation default.
    }
  }

  return (
    <Dialog
      open={!!party}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la partie</DialogTitle>
        </DialogHeader>

        {party && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-[12px] text-body cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isClient")}
                  className="accent-brand-gold-dark"
                />
                Client
              </label>
              <label className="flex items-center gap-2 text-[12px] text-body cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isReferrer")}
                  className="accent-brand-gold-dark"
                />
                Référent
              </label>
            </div>
            {!isClient && !isReferrer && (
              <p className="text-[10.5px] text-warning-text">
                Une partie doit être au moins client ou référent.
              </p>
            )}

            <div>
              <label className="block text-[11.5px] font-medium text-body mb-1.5">
                Nom complet
              </label>
              <Input {...register("fullName")} autoFocus />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-[12px] text-body cursor-pointer">
                <input
                  type="radio"
                  value="individual"
                  {...register("partyType")}
                  className="accent-brand-gold-dark"
                />
                Particulier
              </label>
              <label className="flex items-center gap-2 text-[12px] text-body cursor-pointer">
                <input
                  type="radio"
                  value="company"
                  {...register("partyType")}
                  className="accent-brand-gold-dark"
                />
                Société
              </label>
            </div>
            {partyType === "company" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-body mb-1.5">
                    Raison sociale
                  </label>
                  <Input {...register("tradeName")} />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-body mb-1.5">
                    RCCM / NIF (optionnel)
                  </label>
                  <Input {...register("taxId")} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-medium text-body mb-1.5">
                  Code
                </label>
                <Input {...register("code")} />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-body mb-1.5">
                  Téléphone
                </label>
                <Input {...register("phone")} />
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-body mb-1.5">
                Email
              </label>
              <Input {...register("email")} type="email" />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-body mb-1.5">
                Adresse
              </label>
              <Input {...register("address")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
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
