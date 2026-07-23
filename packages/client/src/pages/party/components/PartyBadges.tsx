import { type Party } from "@/lib/party.api";
import { cn } from "@/lib/utils";

export function PartyRoleBadges({ party }: { party: Pick<Party, "isClient" | "isReferrer"> }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {party.isClient && (
        <span className="inline-flex items-center rounded border border-info-border bg-info-bg px-1.5 py-0.5 text-[10.5px] font-medium text-info-text">
          Client
        </span>
      )}
      {party.isReferrer && (
        <span className="inline-flex items-center rounded border border-purple-100 bg-purple-50 px-1.5 py-0.5 text-[10.5px] font-medium text-purple-700">
          Référent
        </span>
      )}
    </span>
  );
}

export function PartyStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10.5px] font-semibold",
        active
          ? "border-success-border bg-success-bg text-success-text"
          : "border-danger-border bg-danger-bg text-danger-text",
      )}
    >
      {active ? "Actif" : "Désactivé"}
    </span>
  );
}
