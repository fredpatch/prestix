import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "@/lib/invoice.api";
import { queryKeys } from "@/lib/query-keys";

export function useRemoveInvoiceLineMutation(invoiceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lineId: number) => invoiceApi.removeLine(invoiceId, lineId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
    },
  });
}
