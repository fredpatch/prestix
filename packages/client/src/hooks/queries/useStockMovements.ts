import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { stockApi, type StockArticle, type StockMovement } from "@/lib/stock.api";

export interface StockMovementWithArticle extends StockMovement {
  article?: StockArticle;
}

export function useStockMovements(articles: StockArticle[]) {
  const articleIds = articles.map((article) => article.id);

  return useQuery({
    queryKey: queryKeys.stockMovements(articleIds),
    enabled: articleIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        articles.map((article) =>
          stockApi
            .listMovements(article.id)
            .then((response) => ({ article, movements: response.data })),
        ),
      );

      return results
        .flatMap(({ article, movements }) =>
          movements.map<StockMovementWithArticle>((movement) => ({ ...movement, article })),
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });
}
