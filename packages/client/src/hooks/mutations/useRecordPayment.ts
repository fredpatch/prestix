import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentApi, type RecordPaymentInput } from "@/lib/payment.api";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error";
import { queryKeys } from "@/lib/query-keys";

// onOverpaymentRequired is passed in by the dialog for the same reason as
// useIssueInvoiceMutation's onStockConflict — bespoke branching UI state
// stays component-local, the mutation stays reusable.
export function useRecordPaymentMutation(invoiceId: number, onOverpaymentRequired: (amount: number) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => paymentApi.record(invoiceId, input).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
    },
    onError: (error, variables) => {
      if (getApiErrorCode(error) === "OVERPAYMENT_CHOICE_REQUIRED") {
        onOverpaymentRequired(variables.amountTendered);
        return;
      }
      toast.error(getApiErrorMessage(error, "Erreur lors de l'enregistrement."));
    },
  });
}
