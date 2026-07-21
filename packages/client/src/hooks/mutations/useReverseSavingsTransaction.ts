import { useMutation } from "@tanstack/react-query";
import { savingsApi } from "@/lib/savings.api";

// No cache invalidation here — the dialog only receives a transactionId,
// not the owning partyId/accountId, so it can't target the right query
// keys itself. The caller's onReversed callback (PartyDetailPage's
// handleReload) already covers the full invalidation scope.
export function useReverseSavingsTransactionMutation() {
  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: number; reason: string }) =>
      savingsApi.reverse(transactionId, reason).then((r) => r.data),
  });
}
