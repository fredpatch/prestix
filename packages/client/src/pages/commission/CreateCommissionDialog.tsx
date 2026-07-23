import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { commissionCatalogApi, type CommissionType } from "@/lib/commission-catalog.api";
import { type CommissionDetails } from "@/lib/commission.api";
import { PartySelect } from "@/pages/documents/PartySelect";
import { QuickAddPartyDialog } from "@/pages/party/components/QuickAddPartyDialog";
import { CommissionDynamicFields } from "@/components/customs/CommissionDynamicFields";
import type { Party } from "@/lib/party.api";
import { useCreateCommissionMutation } from "@/hooks/mutations/useCreateCommission";

interface CreateCommissionDialogProps {
  onCreated: () => void;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

const commissionFormSchema = z.object({
  date: z.string().min(1, "Date requise."),
  commissionAmount: z
    .number({ invalid_type_error: "Montant requis." })
    .positive("Le montant doit être supérieur à 0."),
  note: z.string().optional(),
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;

function commissionDefaults(): CommissionFormValues {
  return { date: todayISO(), commissionAmount: 0, note: "" };
}

export function CreateCommissionDialog({ onCreated }: CreateCommissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<CommissionType[]>([]);
  const [selectedTypeCode, setSelectedTypeCode] = useState<string>("");
  const [client, setClient] = useState<Party | null>(null);
  const [referrer, setReferrer] = useState<Party | null>(null);
  const [details, setDetails] = useState<CommissionDetails>({});
  const createMutation = useCreateCommissionMutation();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: commissionDefaults(),
  });

  // Only ACTIVE types are offered — matches the catalog's whole point
  // (super_admin can seed a type and flip it live/inactive without a code
  // change anywhere, including here).
  useEffect(() => {
    if (open) {
      commissionCatalogApi.list().then((res) => setTypes(res.data.filter((t) => t.active)));
    }
  }, [open]);

  const selectedType = types.find((t) => t.code === selectedTypeCode);

  function resetAll() {
    setSelectedTypeCode("");
    setClient(null);
    setReferrer(null);
    setDetails({});
    reset(commissionDefaults());
  }

  async function onSubmit(values: CommissionFormValues) {
    try {
      await createMutation.mutateAsync({
        type: selectedTypeCode,
        clientPartyId: client?.id,
        referrerPartyId: referrer?.id,
        date: values.date,
        commissionAmount: values.commissionAmount,
        details,
        note: values.note || undefined,
      });
      toast.success("Commission enregistrée.");
      setOpen(false);
      resetAll();
      onCreated();
    } catch {
      // Error toast already handled by the global mutation default.
    }
  }

  const dateVal = watch("date");
  const amountVal = watch("commissionAmount");
  const canSubmit = Boolean(selectedTypeCode) && Boolean(dateVal) && amountVal > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetAll();
      }}
    >
      <DialogTrigger>
        <Button size="sm">
          <Plus size={14} /> Nouvelle commission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle commission</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select
              value={selectedTypeCode || undefined}
              onValueChange={(v) => {
                setSelectedTypeCode(v);
                setDetails({}); // switching type resets the dynamic fields — different schema entirely
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="— Sélectionner —" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
              />
            </div>
            <div>
              <Label>Montant de la commission</Label>
              <Input type="number" {...register("commissionAmount", { valueAsNumber: true })} />
            </div>
          </div>

          {/* Client/référent are optional everywhere — spec: "absent where N/A,
              e.g. Mobile Money". No hardcoded per-type logic here; every type
              gets the same two optional pickers, whether or not it makes
              sense to fill them in for that particular transaction. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Client (optionnel)</Label>
              <PartySelect value={client} onChange={setClient} placeholder="Rechercher un client..." />
              {!client && (
                <div className="mt-1">
                  <QuickAddPartyDialog
                    role="client"
                    onCreated={setClient}
                    trigger={
                      <button type="button" className="text-[10.5px] text-brand-gold-dark hover:underline">
                        + Ajouter rapidement
                      </button>
                    }
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Référent (optionnel)</Label>
              <PartySelect value={referrer} onChange={setReferrer} filterReferrer placeholder="Rechercher un référent..." />
              {!referrer && (
                <div className="mt-1">
                  <QuickAddPartyDialog
                    role="referrer"
                    onCreated={setReferrer}
                    trigger={
                      <button type="button" className="text-[10.5px] text-brand-gold-dark hover:underline">
                        + Ajouter rapidement
                      </button>
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {selectedType?.fieldSchema && (
            <CommissionDynamicFields fieldSchema={selectedType.fieldSchema} values={details} onChange={setDetails} />
          )}

          {/* Universal, not type-specific — this is the "note" common column,
              always available regardless of which type is selected. */}
          <div>
            <Label>Note (optionnel)</Label>
            <textarea
              {...register("note")}
              rows={2}
              placeholder="Précision libre — nature de la transaction, destination, contexte..."
              className="flex w-full rounded border border-border bg-card px-3 py-2 text-sm resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
