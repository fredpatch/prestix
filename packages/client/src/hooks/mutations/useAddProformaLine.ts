import { useMutation, useQueryClient } from "@tanstack/react-query";
import { proformaApi } from "@/lib/proforma.api";
import type { DocumentLineInput } from "@/lib/proforma.api";
import { queryKeys } from "@/lib/query-keys";

export function useAddProformaLineMutation(proformaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (line: DocumentLineInput) => proformaApi.addLine(proformaId, line).then((r) => r.data),
    onSuccess: () => {
      // Matches the original handleReload's invalidation scope exactly.
      queryClient.invalidateQueries({ queryKey: queryKeys.proforma(proformaId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices() });
    },
  });
}
