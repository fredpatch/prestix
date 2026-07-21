import { Loader2, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscribeSavingsMutation } from "@/hooks/mutations/useSubscribeSavings";

interface SubscribeButtonProps {
  partyId: number;
  onSubscribed: () => void;
}

// Direct subscription — the client pays the inscription fee out of pocket at
// the counter, right now. No dialog needed: the fee amount comes from the
// server setting, not something the agent types in, so there's nothing to
// fill in beyond confirming the action itself.
export function SubscribeButton({ partyId, onSubscribed }: SubscribeButtonProps) {
  const subscribeMutation = useSubscribeSavingsMutation(partyId);

  function handleSubscribe() {
    subscribeMutation.mutate(undefined, { onSuccess: () => onSubscribed() });
  }

  return (
    <Button size="sm" onClick={handleSubscribe} disabled={subscribeMutation.isPending}>
      {subscribeMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <PiggyBank size={13} />}
      Ouvrir un compte épargne
    </Button>
  );
}
