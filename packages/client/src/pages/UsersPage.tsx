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

      {isLoading ? (
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
                  Email
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Rôle
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                  Statut
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td
                    className="px-4 py-2.5 text-[12px] text-neutral-800 cursor-pointer"
                    onClick={() => setEditing(u)}
                  >
                    {u.fullName}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <RolesBadge role={u.role} />
                  </td>
                  <td className="px-4 py-2.5">
                    <AccountStatusBadge active={u.active} firstLogin={u.firstLogin} />
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-1">
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
                        u.active
                          ? "text-red-500 hover:bg-red-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }
                    >
                      <Power size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <EditUserDialog targetUser={editing} onClose={() => setEditing(null)} onUpdated={handleReload} />
    </div>
  );
}
