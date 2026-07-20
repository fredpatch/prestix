import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { commissionApi, type CommissionTransaction } from "@/lib/commission.api";
import { commissionCatalogApi } from "@/lib/commission-catalog.api";
import { partyApi, type Party } from "@/lib/party.api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { CreateCommissionDialog } from "./commission/CreateCommissionDialog";
import { RequestCommissionEditDialog } from "./commission/RequestCommissionEditDialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";

export default function CommissionsPage() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<string>("");
  const queryClient = useQueryClient();

  usePageHeader({ title: "Commissions" });

  const canDelete = user && ["admin", "super_admin"].includes(user.role);

  const { data: types = [] } = useQuery({
    queryKey: queryKeys.commissionTypes(),
    queryFn: () => commissionCatalogApi.list().then((r) => r.data),
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: queryKeys.commissions({ type: typeFilter }),
    queryFn: () => commissionApi.list(typeFilter ? { type: typeFilter } : {}).then((r) => r.data),
  });

  // Party lookup: fetch only the party IDs actually referenced, not the
  // whole table. Keyed off the commission IDs so it refetches when the
  // commission list changes.
  const { data: parties = {} } = useQuery<Record<number, Party>>({
    queryKey: ["commission-parties", commissions.map((c) => c.id)],
    queryFn: async () => {
      const partyIds = [
        ...new Set(
          commissions.flatMap((c) => [c.clientPartyId, c.referrerPartyId]).filter((id): id is number => !!id),
        ),
      ];
      if (partyIds.length === 0) return {};
      const results = await Promise.all(partyIds.map((id) => partyApi.getById(id)));
      return Object.fromEntries(results.map((r) => [r.data.id, r.data]));
    },
    enabled: commissions.length > 0,
  });

  function typeLabel(code: string): string {
    return types.find((t) => t.code === code)?.label ?? code;
  }

  function handleReload() {
    queryClient.invalidateQueries({ queryKey: ["commissions"] });
  }

  async function handleDelete(id: number) {
    await commissionApi.softDelete(id);
    handleReload();
  }

  const total = commissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {commissions.length} commission{commissions.length !== 1 ? "s" : ""} · {total.toLocaleString("fr-FR")} XAF
          </p>
        </div>
        <CreateCommissionDialog onCreated={handleReload} />
      </div>

      <div className="mb-4">
        <Select value={typeFilter || "__all__"} onValueChange={(v) => setTypeFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous les types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t.code} value={t.code}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
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
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Client
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Référent
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Montant
                </th>
                <th className="px-4 py-2.5 w-24"></th>
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
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">
                    {c.clientPartyId ? (parties[c.clientPartyId]?.fullName ?? "…") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">
                    {c.referrerPartyId ? (parties[c.referrerPartyId]?.fullName ?? "…") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] font-medium text-neutral-800 text-right">
                    {parseFloat(c.commissionAmount).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {c.pendingEditRequestId ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 whitespace-nowrap">
                        Modif. en attente
                      </span>
                    ) : (
                      <RequestCommissionEditDialog commission={c} onRequested={handleReload} />
                    )}
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
                  <td colSpan={canDelete ? 8 : 7} className="px-4 py-8 text-center text-[12px] text-neutral-500">
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
