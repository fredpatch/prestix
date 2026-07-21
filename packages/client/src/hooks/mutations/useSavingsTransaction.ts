import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { savingsApi } from "@/lib/savings.api";
import { getApiErrorCode } from "@/lib/api-error";
import { queryKeys } from "@/lib/query-keys";

const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_EPARGNE_BALANCE: "Solde insuffisant pour ce retrait.",
  SAVINGS_AMOUNT_MUST_BE_POSITIVE: "Le montant doit être supérieur à zéro.",
};

export function useSavingsTransactionMutation(partyId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      nature,
      amount,
    }: {
      accountId: number;
      nature: "deposit" | "withdraw";
      amount: number;
    }) =>
      (nature === "deposit" ? savingsApi.deposit(accountId, amount) : savingsApi.withdraw(accountId, amount)).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savings(partyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTransactions() });
    },
    // Overridden at the hook level (replaces the global default toast, does
    // not stack with it) to map known error codes to friendlier messages,
    // same mapping as the original inline ERROR_MESSAGES lookup.
    onError: (error) => {
      const code = getApiErrorCode(error);
      toast.error((code && ERROR_MESSAGES[code]) ?? "Erreur lors de l'enregistrement.");
    },
  });
}
