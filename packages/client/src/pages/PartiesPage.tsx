import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Party } from "@/lib/party.api";
import { CreatePartyDialog } from "./party/components/CreatePartyDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { queryKeys } from "@/lib/query-keys";
import { useParties } from "@/hooks/queries/useParties";

const columns: ColumnDef<Party, any>[] = [
  {
    accessorKey: "fullName",
    header: "Nom",
    cell: ({ row }) => (
      <>
        <Link
          to={`/parties/${row.original.id}`}
          className="text-[12px] font-medium text-brand-gold-dark hover:underline"
        >
          {row.original.fullName}
        </Link>
        {row.original.code && (
          <span className="text-[10.5px] text-neutral-500 ml-1.5">{row.original.code}</span>
        )}
      </>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    cell: ({ row }) => (
      <span className="text-[12px] text-neutral-500">
        {row.original.phone ?? row.original.email ?? "—"}
      </span>
    ),
  },
  {
    id: "role",
    header: "Rôle",
    cell: ({ row }) => (
      <div className="text-[11px]">
        {row.original.isClient && (
          <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 mr-1">
            Client
          </span>
        )}
        {row.original.isReferrer && (
          <span className="inline-block px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
            Référent
          </span>
        )}
      </div>
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
];

export default function PartiesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "client" | "referrer">("");
  const queryClient = useQueryClient();

  // Debounce the search value itself (not the query call) — the standard
  // React Query pattern; queryKey change is what drives the refetch.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading } = useParties({ search: debouncedSearch, roleFilter });
  const parties = data?.data ?? [];
  const total = data?.total ?? 0;

  usePageHeader({ title: "Parties" });

  // CreatePartyDialog isn't on a page-specific mutation hook (it's shared
  // with QuickAddPartyDialog and doesn't know about this page's query key),
  // so it still needs this explicit invalidate via its onCreated prop.
  function handleReload() {
    queryClient.invalidateQueries({ queryKey: queryKeys.parties() });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {total} partie{total !== 1 ? "s" : ""}
          </p>
        </div>
        <CreatePartyDialog onCreated={handleReload} />
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

      {isLoading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : (
        <DataTable columns={columns} data={parties} emptyMessage="Aucune partie trouvée." />
      )}
    </div>
  );
}
