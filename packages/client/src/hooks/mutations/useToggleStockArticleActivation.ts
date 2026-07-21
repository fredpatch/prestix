import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock.api";
import { queryKeys } from "@/lib/query-keys";

export function useToggleStockArticleActivationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      stockApi.toggleActive(id, active).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stock() });
    },
  });
}
