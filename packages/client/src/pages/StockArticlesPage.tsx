import { useState } from "react";
import { Check, CircleSlash } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { type StockArticle } from "@/lib/stock.api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { CreateStockArticleDialog } from "./stock/CreateStockArticleDialog";
import { RestockDialog } from "./stock/RestockDialog";
import { useStockArticles } from "@/hooks/queries/useStockArticles";
import { useToggleStockArticleActivationMutation } from "@/hooks/mutations/useToggleStockArticleActivation";
import { DataTable } from "@/components/ui/data-table";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export default function StockArticlesPage() {
  const { user } = useAuth();
  const [includeInactive, setIncludeInactive] = useState(false);
  const queryClient = useQueryClient();

  usePageHeader({ title: "Stock" });

  const canManage = user && ["manager", "admin", "super_admin"].includes(user.role);

  const { data: articles = [], isLoading } = useStockArticles(includeInactive);
  const toggleMutation = useToggleStockArticleActivationMutation();

  // CreateStockArticleDialog isn't on this page's mutation hook (it's
  // shared with no cache-invalidation target of its own), so it still
  // needs this explicit invalidate via its onCreated prop.
  function handleReload() {
    queryClient.invalidateQueries({ queryKey: queryKeys.stock() });
  }

  function handleToggleActive(article: StockArticle) {
    toggleMutation.mutate({ id: article.id, active: !article.active });
  }

  const columns: ColumnDef<StockArticle, any>[] = [
    {
      accessorKey: "name",
      header: "Article",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-800">
          {row.original.name} <span className="text-neutral-400">({row.original.unit})</span>
        </span>
      ),
    },
    {
      accessorKey: "onHand",
      header: "En stock",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span
          className={`text-[12px] font-medium ${row.original.onHand < row.original.minLevel ? "text-amber-600" : "text-neutral-800"}`}
        >
          {row.original.onHand}
        </span>
      ),
    },
    {
      accessorKey: "minLevel",
      header: "Seuil bas",
      meta: { align: "right" },
      cell: ({ row }) => <span className="text-[12px] text-neutral-500">{row.original.minLevel}</span>,
    },
    {
      accessorKey: "defaultSellingPrice",
      header: "Prix vente",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-500">
          {parseFloat(row.original.defaultSellingPrice).toLocaleString("fr-FR")}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Statut",
      cell: ({ row }) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${row.original.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          {row.original.active ? "Actif" : "Désactivé"}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            meta: { align: "right" as const },
            cell: ({ row }: { row: { original: StockArticle } }) => (
              <div className="text-right space-x-1">
                <RestockDialog article={row.original} onDone={handleReload} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(row.original)}
                  title={row.original.active ? "Désactiver" : "Activer"}
                  disabled={toggleMutation.isPending}
                >
                  {row.original.active ? <CircleSlash size={14} /> : <Check size={14} />}
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && <CreateStockArticleDialog onCreated={handleReload} />}
      </div>

      <label className="flex items-center gap-2 text-[12px] text-neutral-800 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.target.checked)}
          className="accent-brand-gold-dark"
        />
        Inclure les articles désactivés
      </label>

      <DataTable columns={columns} data={articles} loading={isLoading} emptyMessage="Aucun article." />
    </div>
  );
}
