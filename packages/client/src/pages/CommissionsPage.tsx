import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { commissionApi, type CommissionTransaction } from "@/lib/commission.api";
import { commissionCatalogApi, type CommissionType } from "@/lib/commission-catalog.api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { CreateCommissionDialog } from "./commission/CreateCommissionDialog";

export default function CommissionsPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<CommissionTransaction[]>([]);
  const [types, setTypes] = useState<CommissionType[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  usePageHeader({ title: "Commissions" });

  const canDelete = user && ["admin", "super_admin"].includes(user.role);

  // All types (active + inactive) so the filter can still find historical
  // rows recorded under a since-disabled type — soft-disable never hides
  // the transactions themselves (spec: "transactions retain type").
  useEffect(() => {
    commissionCatalogApi.list().then((res) => setTypes(res.data));
  }, []);

  function load() {
    setLoading(true);
    commissionApi.list(typeFilter ? { type: typeFilter } : {}).then((res) => {
      setCommissions(res.data);
      setLoading(false);
    });
  }

  useEffect(load, [typeFilter]);

  async function handleDelete(id: number) {
    await commissionApi.softDelete(id);
    load();
  }

  const total = commissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
  const typeLabel = (code: string) => types.find((t) => t.code === code)?.label ?? code;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {commissions.length} commission{commissions.length !== 1 ? "s" : ""} · {total.toLocaleString("fr-FR")} XAF
          </p>
        </div>
        <CreateCommissionDialog onCreated={load} />
      </div>

      <div className="mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded border border-neutral-200 bg-white px-3 text-[12px]"
        >
          <option value="">Tous les types</option>
          {types.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Type
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Date
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Note
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Montant
                </th>
                {canDelete && <th className="px-4 py-2.5 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-2.5 text-[12px] text-neutral-800">{typeLabel(c.type)}</td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">
                    {new Date(c.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500 max-w-[220px] truncate" title={c.note}>
                    {c.note || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] font-medium text-neutral-800 text-right">
                    {parseFloat(c.commissionAmount).toLocaleString("fr-FR")}
                  </td>
                  {canDelete && (
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr>
                  <td colSpan={canDelete ? 5 : 4} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                    Aucune commission.
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
