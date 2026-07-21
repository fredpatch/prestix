import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  KeyRound,
  LayoutGrid,
  Loader2,
  Power,
  ShieldCheck,
  Table2,
  UserCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type User, type Role } from "@/lib/users.api";
import { CreateUserDialog } from "./users/components/dialogs/CreateUserDialog";
import { RolesBadge } from "./users/components/RolesBadges";
import { AccountStatusBadge } from "./users/components/AccountStatusBadge";
import { EditUserDialog } from "./users/components/dialogs/EditUserDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { useUsers } from "@/hooks/queries/useUsers";
import { useUserStats } from "@/hooks/queries/useUserStats";
import { useToggleUserActivationMutation } from "@/hooks/mutations/useToggleUserActivation";
import { useResetUserOtpMutation } from "@/hooks/mutations/useResetUserOtp";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { UserKpiCard } from "./users/components/UserKpiCard";
import { UserGrid } from "./users/components/UserGrid";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";

function employeeDetailUrl(userId: number): string {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const to = now.toISOString().split("T")[0];
  return `/reporting/employees/${userId}?from=${from}&to=${to}&basis=accrual&source=users`;
}

export default function UsersPage() {
  usePageHeader({ title: "Utilisateurs" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [editing, setEditing] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data, isLoading } = useUsers({ search, roleFilter });
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const toggleMutation = useToggleUserActivationMutation();
  const resetOtpMutation = useResetUserOtpMutation();

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (isMobile) setViewMode("grid");
  }, [isMobile]);

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
      cell: ({ row }) => (
        <AccountStatusBadge active={row.original.active} firstLogin={row.original.firstLogin} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      meta: { align: "right" },
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Link
              to={employeeDetailUrl(u.id)}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              title="Détail employé"
            >
              <BarChart3 size={13} />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              title="Réinitialiser l'OTP"
              disabled={busyId === u.id}
              onClick={() => handleResetOTP(u)}
            >
              {busyId === u.id ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <KeyRound size={13} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title={u.active ? "Désactiver" : "Activer"}
              disabled={busyId === u.id}
              onClick={() => handleToggleActivation(u)}
              className={
                u.active ? "text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
              }
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-neutral-500">
          Comptes internes de l'agence, rôles d'accès et suivi d'activité par employé.
        </p>
        <CreateUserDialog onCreated={handleReload} />
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <UserKpiCard
          label="Total comptes"
          value={statsLoading ? "..." : String(stats?.total ?? 0)}
          detail={`${stats?.active ?? 0} actifs`}
          icon={Users}
          tone="gold"
        />
        <UserKpiCard
          label="Agents"
          value={statsLoading ? "..." : String(stats?.agents ?? 0)}
          detail={`${stats?.managers ?? 0} managers`}
          icon={UserCheck}
          tone="success"
        />
        <UserKpiCard
          label="Administration"
          value={statsLoading ? "..." : String((stats?.admins ?? 0) + (stats?.superAdmins ?? 0))}
          detail={`${stats?.superAdmins ?? 0} super admin`}
          icon={ShieldCheck}
          tone="neutral"
        />
        <UserKpiCard
          label="À surveiller"
          value={statsLoading ? "..." : String((stats?.inactive ?? 0) + (stats?.firstLogin ?? 0))}
          detail={`${stats?.inactive ?? 0} désactivés · ${stats?.firstLogin ?? 0} 1ère connexion`}
          icon={UserRoundX}
          tone={(stats?.inactive ?? 0) + (stats?.firstLogin ?? 0) > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 border-y border-neutral-200 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
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

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-neutral-500">
            {total} résultat{total !== 1 ? "s" : ""}
          </p>
          <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-8 gap-1.5",
                viewMode === "table" && "bg-neutral-100 text-neutral-900",
              )}
            >
              <Table2 size={13} />
              Table
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 gap-1.5",
                viewMode === "grid" && "bg-neutral-100 text-neutral-900",
              )}
            >
              <LayoutGrid size={13} />
              Grille
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-neutral-400" size={18} />
      ) : viewMode === "grid" ? (
        <UserGrid
          users={users}
          busyId={busyId}
          onEdit={setEditing}
          onResetOtp={handleResetOTP}
          onToggleActivation={handleToggleActivation}
        />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          loading={isLoading}
          emptyMessage="Aucun utilisateur trouvé."
        />
      )}

      <EditUserDialog
        targetUser={editing}
        onClose={() => setEditing(null)}
        onUpdated={handleReload}
      />
    </div>
  );
}
