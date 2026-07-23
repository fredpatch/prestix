import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid,
  Loader2,
  Table2,
  UserCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Party } from "@/lib/party.api";
import { CreatePartyDialog } from "./party/components/CreatePartyDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useParties } from "@/hooks/queries/useParties";
import { usePartyStats } from "@/hooks/queries/usePartyStats";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PartyGrid } from "./party/components/PartyGrid";
import { PartyKpiCard } from "./party/components/PartyKpiCard";
import { PartyRoleBadges, PartyStatusBadge } from "./party/components/PartyBadges";
import { useIsMobile } from "@/hooks/useIsMobile";

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
          <span className="text-[10.5px] text-muted-foreground ml-1.5">{row.original.code}</span>
        )}
      </>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    cell: ({ row }) => (
      <span className="text-[12px] text-muted-foreground">
        {row.original.phone ?? row.original.email ?? "—"}
      </span>
    ),
  },
  {
    id: "role",
    header: "Rôle",
    cell: ({ row }) => <PartyRoleBadges party={row.original} />,
  },
  {
    accessorKey: "active",
    header: "Statut",
    cell: ({ row }) => <PartyStatusBadge active={row.original.active} />,
  },
];

export default function PartiesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "client" | "referrer">("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const isMobile = useIsMobile();

  // Debounce the search value itself (not the query call) — the standard
  // React Query pattern; queryKey change is what drives the refetch.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (isMobile) setViewMode("grid");
  }, [isMobile]);

  const { data, isLoading } = useParties({ search: debouncedSearch, roleFilter });
  const { data: stats, isLoading: statsLoading } = usePartyStats();
  const parties = data?.data ?? [];
  const total = data?.total ?? 0;

  usePageHeader({
    title: "Parties",
    helpTopic: "parties",
    guide: {
      steps: [
        "Recherchez une partie par nom, téléphone, email ou code.",
        "Filtrez par rôle (client/référent) ou par statut (actif/inactif).",
        "Cliquez sur « Nouvelle partie » pour en créer une.",
        "Cliquez sur une ligne pour ouvrir sa fiche détail.",
      ],
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Répertoire des clients et référents utilisés dans les documents, commissions, crédits et
          mouvements d'épargne.
        </p>
        <CreatePartyDialog />
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <PartyKpiCard
          label="Total parties"
          value={statsLoading ? "..." : String(stats?.total ?? 0)}
          detail={`${stats?.active ?? 0} actives`}
          icon={Users}
          tone="gold"
        />
        <PartyKpiCard
          label="Clients"
          value={statsLoading ? "..." : String(stats?.clients ?? 0)}
          detail="Peuvent recevoir proformas et factures"
          icon={UserRoundCheck}
          tone="success"
        />
        <PartyKpiCard
          label="Référents"
          value={statsLoading ? "..." : String(stats?.referrers ?? 0)}
          detail={`${stats?.clientAndReferrer ?? 0} aussi clients`}
          icon={UserCheck}
          tone="neutral"
        />
        <PartyKpiCard
          label="Désactivées"
          value={statsLoading ? "..." : String(stats?.inactive ?? 0)}
          detail="Masquées des nouveaux flux"
          icon={UserRoundX}
          tone={stats?.inactive ? "danger" : "neutral"}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 border-y border-border py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Rechercher par nom, email, téléphone, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Select
            value={roleFilter || "__all__"}
            onValueChange={(v) =>
              setRoleFilter(v === "__all__" ? "" : (v as "client" | "referrer"))
            }
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

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-muted-foreground">
            {total} résultat{total !== 1 ? "s" : ""}
          </p>
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-8 gap-1.5",
                viewMode === "table" && "bg-surface-subtle text-foreground",
              )}
            >
              <Table2 size={13} />
              Tableau
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 gap-1.5",
                viewMode === "grid" && "bg-surface-subtle text-foreground",
              )}
            >
              <LayoutGrid size={13} />
              Grille
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-subtle" size={18} />
      ) : viewMode === "grid" ? (
        <PartyGrid parties={parties} />
      ) : (
        <DataTable columns={columns} data={parties} emptyMessage="Aucune partie trouvée." />
      )}
    </div>
  );
}
