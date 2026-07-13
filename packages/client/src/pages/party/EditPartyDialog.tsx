import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { partyApi, type Party } from "@/lib/party.api";

interface EditPartyDialogProps {
  party: Party | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditPartyDialog({ party, onClose, onUpdated }: EditPartyDialogProps) {
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isReferrer, setIsReferrer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (party) {
      setFullName(party.fullName);
      setCode(party.code ?? "");
      setPhone(party.phone ?? "");
      setEmail(party.email ?? "");
      setAddress(party.address ?? "");
      setIsClient(party.isClient);
      setIsReferrer(party.isReferrer);
      setError(null);
    }
  }, [party]);

  async function handleSubmit() {
    if (!party) return;
    setSubmitting(true);
    setError(null);
    try {
      await partyApi.update(party.id, {
        fullName,
        code: code || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        isClient,
        isReferrer,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la modification.",
      );
    } finally {
      setSubmitting(false);
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
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-[12px] text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isClient}
                  onChange={(e) => setIsClient(e.target.checked)}
                  className="accent-brand-gold-dark"
                />
                Client
              </label>
              <label className="flex items-center gap-2 text-[12px] text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReferrer}
                  onChange={(e) => setIsReferrer(e.target.checked)}
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
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Code
                </label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Téléphone
                </label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Email
              </label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Adresse
              </label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            {error && <p className="text-[11px] text-red-600">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !fullName || (!isClient && !isReferrer)}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
