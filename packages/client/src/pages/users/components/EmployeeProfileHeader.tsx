import { CalendarDays, Clock3, Mail, ShieldCheck } from "lucide-react";
import type { User, Role } from "@/lib/users.api";
import { AccountStatusBadge } from "./AccountStatusBadge";
import { RolesBadge } from "./RolesBadges";

const ROLE_LABELS: Record<Role, string> = {
  agent: "Agent",
  manager: "Manager",
  admin: "Admin",
  super_admin: "Super Admin",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function fmtDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

interface EmployeeProfileHeaderProps {
  employee: User;
}

export function EmployeeProfileHeader({ employee }: EmployeeProfileHeaderProps) {
  const infoItems = [
    { label: "Email", value: employee.email, icon: Mail },
    { label: "Type", value: ROLE_LABELS[employee.role], icon: ShieldCheck },
    { label: "Créé le", value: fmtDate(employee.createdAt), icon: CalendarDays },
    { label: "Mis à jour", value: fmtDate(employee.updatedAt), icon: Clock3 },
  ];

  return (
    <section className="mb-6 rounded-lg border border-neutral-200 bg-white px-5 py-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(420px,1.7fr)] lg:items-start">
        <div className="flex gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-[22px] font-bold text-neutral-700">
            {initials(employee.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-[22px] font-semibold leading-tight text-neutral-900">
              {employee.fullName}
            </p>
            <p className="mt-1 text-[11.5px] text-neutral-500">#{employee.id}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <RolesBadge role={employee.role} />
              <AccountStatusBadge active={employee.active} firstLogin={employee.firstLogin} />
            </div>
          </div>
        </div>

        <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="min-w-0 border-l border-neutral-200 pl-3">
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400">
                  <Icon size={11} />
                  {item.label}
                </p>
                <p className="mt-1 truncate text-[12.5px] text-neutral-800">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
