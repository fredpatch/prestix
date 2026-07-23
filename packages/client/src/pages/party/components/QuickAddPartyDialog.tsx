import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
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
import { type Party } from "@/lib/party.api";
import { useCreatePartyMutation } from "@/hooks/mutations/useCreateParty";

interface QuickAddPartyDialogProps {
  role: "client" | "referrer";
  onCreated: (party: Party) => void;
  trigger?: React.ReactNode;
}

export function QuickAddPartyDialog({ role, onCreated, trigger }: QuickAddPartyDialogProps) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const createMutation = useCreatePartyMutation();

  function reset() {
    setFullName("");
    setPhone("");
  }

  function handleSubmit() {
    createMutation.mutate(
      { fullName, phone: phone || undefined, isClient: role === "client", isReferrer: role === "referrer" },
      {
        onSuccess: (party) => {
          setOpen(false);
          reset();
          onCreated(party);
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
        {trigger ?? (
          <Button variant="outline" size="sm">
            <UserPlus size={13} /> {role === "client" ? "Nouveau client" : "Nouveau référent"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {role === "client" ? "Nouveau client" : "Nouveau référent"} (ajout rapide)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-[11.5px] font-medium text-body mb-1.5">
              Nom complet
            </label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-body mb-1.5">
              Téléphone (optionnel)
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || !fullName}>
            {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
