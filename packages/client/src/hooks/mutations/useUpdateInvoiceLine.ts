import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "@/lib/invoice.api";
import type { DocumentLineInput } from "@/lib/proforma.api";
import { queryKeys } from "@/lib/query-keys";

export function useUpdateInvoiceLineMutation(invoiceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, patch }: { lineId: number; patch: Partial<DocumentLineInput> }) =>
      invoiceApi.updateLine(invoiceId, lineId, patch).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
    },
  });
}
