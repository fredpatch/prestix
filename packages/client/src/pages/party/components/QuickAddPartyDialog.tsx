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
import { partyApi, type Party } from "@/lib/party.api";

interface QuickAddPartyDialogProps {
  role: "client" | "referrer";
  onCreated: (party: Party) => void;
  trigger?: React.ReactNode;
}

export function QuickAddPartyDialog({ role, onCreated, trigger }: QuickAddPartyDialogProps) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFullName("");
    setPhone("");
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await partyApi.create({
        fullName,
        phone: phone || undefined,
        isClient: role === "client",
        isReferrer: role === "referrer",
      });
      setOpen(false);
      reset();
      onCreated(res.data);
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
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Nom complet
            </label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
              Téléphone (optionnel)
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !fullName}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
