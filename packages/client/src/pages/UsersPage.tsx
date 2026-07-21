import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, KeyRound, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type User, type Role } from "@/lib/users.api";
import { CreateUserDialog } from "./users/components/dialogs/CreateUserDialog";
import { RolesBadge } from "./users/components/RolesBadges";
import { AccountStatusBadge } from "./users/components/AccountStatusBadge";
import { EditUserDialog } from "./users/components/dialogs/EditUserDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { useUsers } from "@/hooks/queries/useUsers";
import { useToggleUserActivationMutation } from "@/hooks/mutations/useToggleUserActivation";
import { useResetUserOtpMutation } from "@/hooks/mutations/useResetUserOtp";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

export default function UsersPage() {
  usePageHeader({ title: "Utilisateurs" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [editing, setEditing] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useUsers({ search, roleFilter });
  const toggleMutation = useToggleUserActivationMutation();
  const resetOtpMutation = useResetUserOtpMutation();

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  // Both actions share one "which row is busy" indicator, same as before —
  // only one of the two mutations can be in flight per click, so this is
  // just picking whichever one has a pending call right now.
  const busyId = toggleMutation.isPending
    ? toggleMutation.variables?.id
    : resetOtpMutation.isPending
      ? resetOtpMutation.variables
      : null;

  // CreateUserDialog/EditUserDialog aren't on useMutation yet (out of scope
  // for this pass — see the RHF-dialogs note), so they still need an
  // explicit invalidate via this callback after their own plain API calls.
  function handleReload() {
    queryClient.invalidateQueries({ queryKey: queryKeys.users() });
  }

  function handleToggleActivation(u: User) {
    toggleMutation.mutate({ id: u.id, active: !u.active });
  }

  function handleResetOTP(u: User) {
    resetOtpMutation.mutate(u.id, {
      onSuccess: () => toast.success(`Nouveau code OTP envoyé à ${u.email}.`),
    });
  }

  // onClick lives on the Nom cell only (opens the edit dialog) — not a
  // full-row click, since the Actions column has its own buttons that must
  // not also trigger the row handler.
  const columns: ColumnDef<User, any>[] = [
    {
      accessorKey: "fullName",
      header: "Nom",
      cell: ({ row }) => (
        <span
          className="text-[12px] text-neutral-800 cursor-pointer"
          onClick={() => setEditing(row.original)}
        >
          {row.original.fullName}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-[12px] text-neutral-500">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Rôle",
      cell: ({ row }) => <RolesBadge role={row.original.role} />,
    },
    {
      accessorKey: "active",
      header: "Statut",
      cell: ({ row }) => <AccountStatusBadge active={row.original.active} firstLogin={row.original.firstLogin} />,
    },
    {
      id: "actions",
      header: "Actions",
      meta: { align: "right" },
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="text-right space-x-1">
            <Button
              variant="ghost"
              size="icon"
              title="Réinitialiser l'OTP"
              disabled={busyId === u.id}
              onClick={() => handleResetOTP(u)}
            >
              {busyId === u.id ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title={u.active ? "Désactiver" : "Activer"}
              disabled={busyId === u.id}
              onClick={() => handleToggleActivation(u)}
              className={u.active ? "text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}
            >
              <Power size={13} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {total} compte{total !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateUserDialog onCreated={handleReload} />
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={roleFilter || "__all__"}
          onValueChange={(v) => setRoleFilter(v === "__all__" ? "" : (v as Role))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous les rôles</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        emptyMessage="Aucun utilisateur trouvé."
      />

      <EditUserDialog targetUser={editing} onClose={() => setEditing(null)} onUpdated={handleReload} />
    </div>
  );
}
