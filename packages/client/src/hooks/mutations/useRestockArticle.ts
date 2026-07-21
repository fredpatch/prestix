import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock.api";
import { queryKeys } from "@/lib/query-keys";

export function useRestockArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, quantity }: { id: number; type: "IN" | "ADJUST"; quantity: number }) =>
      stockApi.restock(id, type, quantity).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stock() });
    },
  });
}
