import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "@/lib/invoice.api";
import { queryKeys } from "@/lib/query-keys";

export function useCancelInvoiceMutation(invoiceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => invoiceApi.cancel(invoiceId, reason).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
    },
  });
}
