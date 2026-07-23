import { Loader2, Mail, MapPin, Pencil, Phone, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Party } from "@/lib/party.api";
import { cn } from "@/lib/utils";
import { PartyRoleBadges, PartyStatusBadge } from "./PartyBadges";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function roleLabel(party: Party): string {
  if (party.isClient && party.isReferrer) return "Client et référent";
  if (party.isClient) return "Client";
  if (party.isReferrer) return "Référent";
  return "Rôle non renseigné";
}

interface PartyProfileHeaderProps {
  party: Party;
  canManage: boolean;
  toggling: boolean;
  onEdit: () => void;
  onToggleActivation: () => void;
}

export function PartyProfileHeader({
  party,
  canManage,
  toggling,
  onEdit,
  onToggleActivation,
}: PartyProfileHeaderProps) {
  const infoItems = [
    { label: "Téléphone", value: party.phone ?? "Non renseigné", icon: Phone },
    { label: "Email", value: party.email ?? "Non renseigné", icon: Mail },
    { label: "Adresse", value: party.address ?? "Non renseignée", icon: MapPin },
    { label: "Type", value: roleLabel(party), icon: null },
    ...(party.partyType === "company"
      ? [{ label: "RCCM / NIF", value: party.taxId ?? "Non renseigné", icon: null }]
      : []),
  ];

  return (
    <section className="bg-card border border-border rounded-lg px-5 py-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(360px,1.5fr)_auto] lg:items-start">
        <div className="flex gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-[22px] font-bold text-body">
            {initials(party.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-[22px] font-semibold leading-tight text-foreground">
              {party.fullName}
            </p>
            {party.partyType === "company" && party.tradeName && (
              <p className="mt-0.5 text-[12px] text-muted-foreground">{party.tradeName}</p>
            )}
            <p className="mt-1 text-[11.5px] text-muted-foreground">{party.code ?? `#${party.id}`}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <PartyRoleBadges party={party} />
              <PartyStatusBadge active={party.active} />
            </div>
          </div>
        </div>

        <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="min-w-0 border-l border-border pl-3">
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-subtle">
                  {Icon && <Icon size={11} />}
                  {item.label}
                </p>
                <p className="mt-1 truncate text-[12.5px] text-body">{item.value}</p>
              </div>
            );
          })}
        </div>

        {canManage && (
          <div className="flex gap-2 lg:justify-end">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil size={13} /> Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleActivation}
              disabled={toggling}
              className={cn(
                party.active
                  ? "text-danger-text hover:bg-danger-bg"
                  : "text-success-text hover:bg-success-bg",
              )}
            >
              {toggling ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
              {party.active ? "Désactiver" : "Activer"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
