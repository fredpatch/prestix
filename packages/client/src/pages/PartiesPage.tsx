import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { partyApi, type Party } from "@/lib/party.api";
import { CreatePartyDialog } from "./party/components/CreatePartyDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "client" | "referrer">("");

  const load = useCallback(() => {
    setLoading(true);
    partyApi
      .list({
        search: search || undefined,
        isClient: roleFilter === "client" ? true : undefined,
        isReferrer: roleFilter === "referrer" ? true : undefined,
      })
      .then((res) => {
        setParties(res.data.data);
        setTotal(res.data.total);
        setLoading(false);
      });
  }, [search, roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  usePageHeader({ title: "Parties" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {total} partie{total !== 1 ? "s" : ""}
          </p>
        </div>
        <CreatePartyDialog onCreated={load} />
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Rechercher par nom, email, téléphone, code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={roleFilter || "__all__"}
          onValueChange={(v) => setRoleFilter(v === "__all__" ? "" : (v as "client" | "referrer"))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="referrer">Référents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Nom
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Contact
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Rôle
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {parties.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/parties/${p.id}`}
                      className="text-[12px] font-medium text-brand-gold-dark hover:underline"
                    >
                      {p.fullName}
                    </Link>
                    {p.code && (
                      <span className="text-[10.5px] text-neutral-500 ml-1.5">{p.code}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">
                    {p.phone ?? p.email ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[11px]">
                    {p.isClient && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 mr-1">
                        Client
                      </span>
                    )}
                    {p.isReferrer && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                        Référent
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${p.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {p.active ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                </tr>
              ))}
              {parties.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                    Aucune partie trouvée.
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
