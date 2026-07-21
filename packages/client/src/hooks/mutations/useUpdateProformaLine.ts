import { useMutation, useQueryClient } from "@tanstack/react-query";
import { proformaApi } from "@/lib/proforma.api";
import type { DocumentLineInput } from "@/lib/proforma.api";
import { queryKeys } from "@/lib/query-keys";

export function useUpdateProformaLineMutation(proformaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, patch }: { lineId: number; patch: Partial<DocumentLineInput> }) =>
      proformaApi.updateLine(proformaId, lineId, patch).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proforma(proformaId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices() });
    },
  });
}
