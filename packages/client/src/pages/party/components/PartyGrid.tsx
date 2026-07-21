import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { type Party } from "@/lib/party.api";
import { PartyRoleBadges, PartyStatusBadge } from "./PartyBadges";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function PartyGrid({ parties }: { parties: Party[] }) {
  if (parties.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg px-4 py-8 text-center text-[12px] text-neutral-500">
        Aucune partie trouvée.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {parties.map((party) => (
        <Link
          key={party.id}
          to={`/parties/${party.id}`}
          className="group bg-white border border-neutral-200 rounded-lg p-4 transition-colors hover:border-brand-gold-dark"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-[13px] font-bold text-neutral-700">
              {initials(party.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-neutral-900 group-hover:text-brand-gold-dark">
                    {party.fullName}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-neutral-500">
                    {party.code ?? `#${party.id}`}
                  </p>
                </div>
                <PartyStatusBadge active={party.active} />
              </div>

              <div className="mt-2">
                <PartyRoleBadges party={party} />
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-neutral-100 pt-3 text-[11.5px] text-neutral-500">
            <p className="flex items-center gap-2">
              <Phone size={12} className="text-neutral-400" />
              <span className="truncate">{party.phone ?? "Téléphone non renseigné"}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail size={12} className="text-neutral-400" />
              <span className="truncate">{party.email ?? "Email non renseigné"}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={12} className="text-neutral-400" />
              <span className="truncate">{party.address ?? "Adresse non renseignée"}</span>
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
