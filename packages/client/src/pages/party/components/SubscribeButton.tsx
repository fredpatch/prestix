import { useState } from "react";
import { Loader2, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savingsApi } from "@/lib/savings.api";

interface SubscribeButtonProps {
  partyId: number;
  onSubscribed: () => void;
}

// Direct subscription — the client pays the inscription fee out of pocket at
// the counter, right now. No dialog needed: the fee amount comes from the
// server setting, not something the agent types in, so there's nothing to
// fill in beyond confirming the action itself.
export function SubscribeButton({ partyId, onSubscribed }: SubscribeButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setSubmitting(true);
    setError(null);
    try {
      await savingsApi.subscribe(partyId);
      onSubscribed();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de l'ouverture du compte.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Button size="sm" onClick={handleSubscribe} disabled={submitting}>
        {submitting ? <Loader2 size={13} className="animate-spin" /> : <PiggyBank size={13} />}
        Ouvrir un compte épargne
      </Button>
      {error && <p className="text-[10.5px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}
