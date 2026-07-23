import { cn } from "@/lib/utils";
import type { Role } from "@/lib/users.api";

const ROLE_LABELS: Record<Role, string> = {
  agent: "Agent",
  manager: "Manager",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ROLE_STYLES: Record<Role, string> = {
  agent: "bg-surface-subtle text-body",
  manager: "bg-info-bg text-info-text",
  admin: "bg-warning-bg text-warning-text",
  super_admin: "bg-brand-gold-dark/10 text-brand-gold-dark",
};

export function RolesBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold",
        ROLE_STYLES[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
