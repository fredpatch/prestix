import { cn } from "@/lib/utils";

interface AccountStatusBadgeProps {
  active: boolean;
  firstLogin: boolean;
  classNameDeactivated?: string;
  classNameFirstLogin?: string;
  classNameActive?: string;
}

export function AccountStatusBadge({
  active,
  firstLogin,
  classNameDeactivated,
  classNameFirstLogin,
  classNameActive,
}: AccountStatusBadgeProps) {
  if (!active) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold bg-danger-bg text-danger-text",
          classNameDeactivated,
        )}
      >
        Désactivé
      </span>
    );
  }
  if (firstLogin) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold bg-warning-bg text-warning-text",
          classNameFirstLogin,
        )}
      >
        1ère connexion
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold bg-success-bg text-success-text",
        classNameActive,
      )}
    >
      Actif
    </span>
  );
}
