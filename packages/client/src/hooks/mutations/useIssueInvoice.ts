import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoiceApi, type PaymentPlanInput } from "@/lib/invoice.api";
import { queryKeys } from "@/lib/query-keys";

const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK: "Stock insuffisant pour au moins un article de cette facture.",
  INVOICE_HAS_NO_LINES: "La facture n'a aucune ligne.",
  INVALID_INSTALLMENT_COUNT: "Le nombre d'échéances doit être entre 1 et 3.",
  INSTALLMENTS_MUST_SUM_TO_TOTAL: "La somme des échéances doit égaler le total de la facture.",
  NEGATIVE_STOCK_OVERRIDE_REQUIRES_MANAGER:
    "Seul un manager peut forcer l'émission avec un stock insuffisant.",
};

// onStockConflict is passed in by the dialog rather than baked into the
// hook, so the bespoke "offer to force-issue" UI stays component-local
// state while the mutation itself (and its cache invalidation) stays
// reusable/testable like every other mutation hook. canOverrideStock is
// passed in too — a non-manager hitting INSUFFICIENT_STOCK should still
// get the generic error message, not a UI they can't use.
export function useIssueInvoiceMutation(
  invoiceId: number,
  canOverrideStock: boolean,
  onStockConflict: () => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      paymentPlan,
      allowNegativeStockOverride,
    }: {
      requestId: string;
      paymentPlan: PaymentPlanInput;
      allowNegativeStockOverride?: boolean;
    }) => invoiceApi.issue(invoiceId, requestId, paymentPlan, allowNegativeStockOverride).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
    },
    // Overridden at the hook level (replaces the global default toast) so
    // INSUFFICIENT_STOCK can trigger the manager-override UI instead of a
    // generic error toast; every other code still gets its mapped message.
    onError: (error) => {
      const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "INSUFFICIENT_STOCK" && canOverrideStock) {
        onStockConflict();
        return;
      }
      toast.error((code && ERROR_MESSAGES[code]) ?? "Erreur lors de l'émission.");
    },
  });
}
