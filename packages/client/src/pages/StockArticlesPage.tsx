import { useEffect, useState } from "react";
import { Check, CircleSlash, Loader2 } from "lucide-react";
import { stockApi, type StockArticle } from "@/lib/stock.api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { CreateStockArticleDialog } from "./stock/CreateStockArticleDialog";
import { RestockDialog } from "./stock/RestockDialog";

export default function StockArticlesPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<StockArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);

  usePageHeader({ title: "Stock" });

  const canManage = user && ["manager", "admin", "super_admin"].includes(user.role);

  function load() {
    setLoading(true);
    stockApi.list(includeInactive).then((res) => {
      setArticles(res.data);
      setLoading(false);
    });
  }

  useEffect(load, [includeInactive]);

  async function handleToggleActive(article: StockArticle) {
    await stockApi.toggleActive(article.id, !article.active);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && <CreateStockArticleDialog onCreated={load} />}
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

      {loading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Article
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  En stock
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Seuil bas
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Prix vente
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Statut
                </th>
                {canManage && <th className="px-4 py-2.5 w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-2.5 text-[12px] text-neutral-800">
                    {a.name} <span className="text-neutral-400">({a.unit})</span>
                  </td>
                  <td
                    className={`px-4 py-2.5 text-[12px] text-right font-medium ${a.onHand < a.minLevel ? "text-amber-600" : "text-neutral-800"}`}
                  >
                    {a.onHand}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">
                    {a.minLevel}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">
                    {parseFloat(a.defaultSellingPrice).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${a.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {a.active ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right space-x-1">
                      <RestockDialog article={a} onDone={load} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(a)}
                        title={a.active ? "Désactiver" : "Activer"}
                      >
                        {a.active ? <CircleSlash size={14} /> : <Check size={14} />}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="px-4 py-8 text-center text-[12px] text-neutral-500"
                  >
                    Aucun article.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
