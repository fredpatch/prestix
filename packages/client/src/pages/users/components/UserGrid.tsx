import { Link } from "react-router-dom";
import { BarChart3, KeyRound, Mail, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type User } from "@/lib/users.api";
import { RolesBadge } from "./RolesBadges";
import { AccountStatusBadge } from "./AccountStatusBadge";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function employeeDetailUrl(userId: number): string {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const to = now.toISOString().split("T")[0];
  return `/reporting/employees/${userId}?from=${from}&to=${to}&basis=accrual&source=users`;
}

interface UserGridProps {
  users: User[];
  busyId: number | null;
  onEdit: (user: User) => void;
  onResetOtp: (user: User) => void;
  onToggleActivation: (user: User) => void;
}

export function UserGrid({ users, busyId, onEdit, onResetOtp, onToggleActivation }: UserGridProps) {
  if (users.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg px-4 py-8 text-center text-[12px] text-neutral-500">
        Aucun utilisateur trouvé.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <div key={user.id} className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => onEdit(user)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-[13px] font-bold text-neutral-700"
              title="Modifier l'utilisateur"
            >
              {initials(user.fullName)}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="truncate text-left text-[13px] font-semibold text-neutral-900 hover:text-brand-gold-dark"
                  >
                    {user.fullName}
                  </button>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[10.5px] text-neutral-500">
                    <Mail size={11} className="shrink-0 text-neutral-400" />
                    {user.email}
                  </p>
                </div>
                <AccountStatusBadge active={user.active} firstLogin={user.firstLogin} />
              </div>
              <div className="mt-2">
                <RolesBadge role={user.role} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
            <Link
              to={employeeDetailUrl(user.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-medium text-brand-gold-dark hover:bg-brand-gold-light/30"
            >
              <BarChart3 size={13} />
              Détail employé
            </Link>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                title="Réinitialiser l'OTP"
                disabled={busyId === user.id}
                onClick={() => onResetOtp(user)}
              >
                <KeyRound size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={user.active ? "Désactiver" : "Activer"}
                disabled={busyId === user.id}
                onClick={() => onToggleActivation(user)}
                className={
                  user.active
                    ? "text-red-500 hover:bg-red-50"
                    : "text-emerald-600 hover:bg-emerald-50"
                }
              >
                <Power size={13} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
