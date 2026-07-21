import { useMutation } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock.api";

// StockArticlesPage isn't on React Query yet — no cache to invalidate here;
// the dialog's own onCreated prop still drives that page's refresh.
export function useCreateStockArticleMutation() {
  return useMutation({
    mutationFn: (data: Parameters<typeof stockApi.create>[0]) =>
      stockApi.create(data).then((r) => r.data),
  });
}
