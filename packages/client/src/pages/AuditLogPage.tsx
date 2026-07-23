import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { usersApi } from "@/lib/users.api";
import type { AuditLogRow } from "@/lib/audit-log.api";
import {
  useAuditLog,
  useAuditLogActions,
  useAuditLogEntityTypes,
} from "@/hooks/queries/useAuditLog";
import { usePageHeader } from "@/components/layouts/lib/page-header";

// Pure display layer over the audit_log table every module already writes
// to via logAudit() — no new tracking. Backend route is admin+ only
// (packages/server/src/modules/audit-log), stricter than reporting's
// agent+ read, since this exposes every action by every user unfiltered.
// Own top-level page (not a Paramètres tab) — Paramètres' other three tabs
// are deliberately super_admin-only (M2 spec: financial settings, feature
// flags, commission catalog all gate mutations at requireSuperAdmin), so
// admin+ users can't be given that page's nav entry without exposing them
// to buttons that 403. This page has its own admin+ nav item instead.

const PAGE_SIZE = 12;

function humanizeAction(action: string): string {
  const lower = action.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function AuditLogPage() {
  usePageHeader({
    title: "Journal d'audit",
    helpTopic: "audit-log",
    guide: {
      steps: [
        "Filtrez par utilisateur, action, type d'entité ou plage de dates.",
        "Cliquez sur une entrée pour voir le détail des métadonnées.",
      ],
      tip: "Page en lecture seule — pour corriger une action, utilisez la fonction de correction propre au module concerné.",
    },
  });

  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [action, setAction] = useState<string | undefined>(undefined);
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = { userId, action, entityType, from: from || undefined, to: to || undefined };

  // isFetching (not just isLoading) drives the inline spinner below — with
  // placeholderData keeping the previous page's rows on screen during a
  // refetch, isLoading alone stays false after the first load, so changing
  // a filter looked like a no-op for ~2s with nothing on screen telling the
  // user a request was actually in flight.
  const { data, isLoading, isFetching } = useAuditLog({ ...filters, page, pageSize: PAGE_SIZE });
  const { data: actions = [] } = useAuditLogActions();
  const { data: entityTypes = [] } = useAuditLogEntityTypes();

  const { data: userOptions = [] } = useQuery({
    queryKey: ["users", "audit-log-lookup"],
    queryFn: () => usersApi.list({ pageSize: 200 }).then((r) => r.data.data),
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  function resetFilters() {
    setUserId(undefined);
    setAction(undefined);
    setEntityType(undefined);
    setFrom("");
    setTo("");
    setPage(1);
  }

  const columns: ColumnDef<AuditLogRow, any>[] = [
    {
      accessorKey: "createdAt",
      header: "Date / heure",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-600">
          {format(parseISO(row.original.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
        </span>
      ),
    },
    {
      accessorKey: "actorName",
      header: "Utilisateur",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-800">{row.original.actorName ?? "Système"}</span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-800" title={row.original.action}>
          {humanizeAction(row.original.action)}
        </span>
      ),
    },
    {
      accessorKey: "entityType",
      header: "Entité",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-500">
          {row.original.entityType}
          {row.original.entityId ? ` #${row.original.entityId}` : ""}
        </span>
      ),
    },
    {
      id: "details",
      header: "Détails",
      cell: ({ row }) => {
        const metadata = row.original.metadata;
        if (!metadata || Object.keys(metadata).length === 0) {
          return <span className="text-[12px] text-neutral-300">—</span>;
        }
        return (
          <Popover>
            <PopoverTrigger type="button" className="text-neutral-400 hover:text-neutral-600">
              <Info size={14} />
            </PopoverTrigger>
            <PopoverContent className="w-72 text-[11px] space-y-1">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-neutral-500">{key}</span>
                  <span className="text-neutral-800 text-right break-all">{String(value)}</span>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  return (
    <div>
      <p className="text-neutral-500 text-sm mb-6">
        Historique complet des actions effectuées dans l'application.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select
          value={userId !== undefined ? String(userId) : "__all__"}
          onValueChange={(v) => {
            setUserId(v === "__all__" ? undefined : parseInt(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les utilisateurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous les utilisateurs</SelectItem>
            {userOptions.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={action ?? "__all__"}
          onValueChange={(v) => {
            setAction(v === "__all__" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Toutes les actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes les actions</SelectItem>
            {actions.map((a: string) => (
              <SelectItem key={a} value={a}>
                {humanizeAction(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={entityType ?? "__all__"}
          onValueChange={(v) => {
            setEntityType(v === "__all__" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Toutes les entités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes les entités</SelectItem>
            {entityTypes.map((e: string) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DatePicker
          value={from}
          onChange={(v) => {
            setFrom(v);
            setPage(1);
          }}
          placeholder="Depuis"
          className="w-40"
        />
        <DatePicker
          value={to}
          onChange={(v) => {
            setTo(v);
            setPage(1);
          }}
          placeholder="Jusqu'à"
          className="w-40"
        />

        <Button variant="secondary" size="sm" onClick={resetFilters}>
          Réinitialiser
        </Button>

        {isFetching && (
          <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Loader2 size={12} className="animate-spin" />
            Recherche...
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        emptyMessage="Aucune entrée trouvée."
      />

      <div className="flex items-center justify-between mt-3">
        <p className="text-[11px] text-neutral-500">
          {total} entrée{total !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={13} />
          </Button>
          <span className="text-[11px] text-neutral-500">
            Page {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
