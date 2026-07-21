import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { CreateCommissionDialog } from "./commission/CreateCommissionDialog";
import { RequestCommissionEditDialog } from "./commission/RequestCommissionEditDialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { useCommissionTypes } from "@/hooks/queries/useCommissionTypes";
import { useCommissions } from "@/hooks/queries/useCommissions";
import { useCommissionParties } from "@/hooks/queries/useCommissionParties";
import { useDeleteCommissionMutation } from "@/hooks/mutations/useDeleteCommission";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { CommissionTransaction } from "@/lib/commission.api";

export default function CommissionsPage() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<string>("");
  const queryClient = useQueryClient();

  usePageHeader({ title: "Commissions" });

  const canDelete = user && ["admin", "super_admin"].includes(user.role);

  const { data: types = [] } = useCommissionTypes();
  const { data: commissions = [], isLoading } = useCommissions({ type: typeFilter });
  const { data: parties = {} } = useCommissionParties(commissions);
  const deleteMutation = useDeleteCommissionMutation();

  function typeLabel(code: string): string {
    return types.find((t) => t.code === code)?.label ?? code;
  }

  // CreateCommissionDialog/RequestCommissionEditDialog aren't on useMutation
  // yet (out of scope for this pass), so they still need this explicit
  // invalidate after their own plain API calls.
  function handleReload() {
    queryClient.invalidateQueries({ queryKey: queryKeys.commissions() });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(id);
  }

  const total = commissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

  const columns: ColumnDef<CommissionTransaction, any>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <span className="text-[12px] text-neutral-800">{typeLabel(row.original.type)}</span>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-500">
          {new Date(row.original.date).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => (
        <span
          className="text-[12px] text-neutral-500 max-w-[220px] truncate block"
          title={row.original.note}
        >
          {row.original.note || "—"}
        </span>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-500">
          {row.original.clientPartyId ? (parties[row.original.clientPartyId]?.fullName ?? "…") : "—"}
        </span>
      ),
    },
    {
      id: "referrer",
      header: "Référent",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-500">
          {row.original.referrerPartyId ? (parties[row.original.referrerPartyId]?.fullName ?? "…") : "—"}
        </span>
      ),
    },
    {
      accessorKey: "commissionAmount",
      header: "Montant",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="text-[12px] font-medium text-neutral-800">
          {parseFloat(row.original.commissionAmount).toLocaleString("fr-FR")}
        </span>
      ),
    },
    {
      id: "editRequest",
      header: "",
      meta: { align: "right" },
      cell: ({ row }) =>
        row.original.pendingEditRequestId ? (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 whitespace-nowrap">
            Modif. en attente
          </span>
        ) : (
          <RequestCommissionEditDialog commission={row.original} onRequested={handleReload} />
        ),
    },
    ...(canDelete
      ? [
          {
            id: "actions",
            header: "",
            meta: { align: "right" as const },
            cell: ({ row }: { row: { original: CommissionTransaction } }) => (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(row.original.id)}
                className="text-red-500 hover:bg-red-50"
                title="Supprimer"
              >
                <Trash2 size={13} />
              </Button>
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

      <DataTable
        columns={columns}
        data={commissions}
        loading={isLoading}
        emptyMessage="Aucune commission."
      />
    </div>
  );
}
