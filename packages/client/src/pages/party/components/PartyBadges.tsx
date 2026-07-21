import { type Party } from "@/lib/party.api";
import { cn } from "@/lib/utils";

export function PartyRoleBadges({ party }: { party: Pick<Party, "isClient" | "isReferrer"> }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {party.isClient && (
        <span className="inline-flex items-center rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-medium text-blue-700">
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
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-red-100 bg-red-50 text-red-700",
      )}
    >
      {active ? "Actif" : "Désactivé"}
    </span>
  );
}
