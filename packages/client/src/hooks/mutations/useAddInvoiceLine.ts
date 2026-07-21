import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "@/lib/invoice.api";
import type { DocumentLineInput } from "@/lib/proforma.api";
import { queryKeys } from "@/lib/query-keys";

export function useAddInvoiceLineMutation(invoiceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (line: DocumentLineInput) => invoiceApi.addLine(invoiceId, line).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
    },
  });
}
