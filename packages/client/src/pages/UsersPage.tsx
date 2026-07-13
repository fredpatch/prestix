import { useEffect, useState, useCallback } from "react";
import { Loader2, KeyRound, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usersApi, type User, type Role } from "@/lib/users.api";
import { CreateUserDialog } from "./users/components/dialogs/CreateUserDialog";
import { RolesBadge } from "./users/components/RolesBadges";
import { AccountStatusBadge } from "./users/components/AccountStatusBadge";
import { EditUserDialog } from "./users/components/dialogs/EditUserDialog";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [editing, setEditing] = useState<User | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    usersApi
      .list({ search: search || undefined, role: (roleFilter || undefined) as Role | undefined })
      .then((res) => {
        setUsers(res.data.data);
        setTotal(res.data.total);
        setLoading(false);
      });
  }, [search, roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce search
    return () => clearTimeout(timeout);
  }, [load]);

  async function handleToggleActivation(u: User) {
    setActionId(u.id);
    try {
      await usersApi.toggleActivation(u.id, !u.active);
      load();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Action impossible.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleResetOTP(u: User) {
    setActionId(u.id);
    try {
      await usersApi.resetOTP(u.id);
      alert(`Nouveau code OTP envoyé à ${u.email}.`);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-brand-gold-dark">Utilisateurs</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {total} compte{total !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateUserDialog onCreated={load} />
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "")}
          className="h-10 rounded border border-neutral-200 bg-white px-3 text-sm text-neutral-800"
        >
          <option value="">Tous les rôles</option>
          <option value="agent">Agent</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
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
                      disabled={actionId === u.id}
                      onClick={() => handleResetOTP(u)}
                    >
                      {actionId === u.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <KeyRound size={13} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={u.active ? "Désactiver" : "Activer"}
                      disabled={actionId === u.id}
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

      <EditUserDialog targetUser={editing} onClose={() => setEditing(null)} onUpdated={load} />
    </div>
  );
}
