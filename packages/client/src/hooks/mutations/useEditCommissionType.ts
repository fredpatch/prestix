import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionCatalogApi } from "@/lib/commission-catalog.api";
import { queryKeys } from "@/lib/query-keys";

export function useEditCommissionTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      data,
    }: {
      code: string;
      data: Parameters<typeof commissionCatalogApi.update>[1];
    }) => commissionCatalogApi.update(code, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissionTypes() });
    },
  });
}
