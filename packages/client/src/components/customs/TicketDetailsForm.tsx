import { Input } from "@/components/ui/input";
import type { TicketDetailsInput } from "@/lib/proforma.api";

interface TicketDetailsFormProps {
  value: TicketDetailsInput;
  onChange: (value: TicketDetailsInput) => void;
}

const TRAVEL_CLASSES: { value: TicketDetailsInput["travelClass"]; label: string }[] = [
  { value: "economy", label: "Économique (eco)" },
  { value: "business", label: "Affaires (bnss)" },
  { value: "first", label: "Première (prem)" },
  { value: "premium", label: "Premium (prm)" },
];

export function TicketDetailsForm({ value, onChange }: TicketDetailsFormProps) {
  const segment = value.segments[0] ?? { from: "", to: "", date: "" };

  function updateSegment(patch: Partial<typeof segment>) {
    onChange({ ...value, segments: [{ ...segment, ...patch }] });
  }

  return (
    <div className="mt-2 p-3 bg-white border border-neutral-200 rounded-lg space-y-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
        Détails du billet
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">Passager</label>
          <Input
            value={value.passengerName}
            onChange={(e) => onChange({ ...value, passengerName: e.target.value })}
            placeholder="Nom complet"
            className="h-8 text-[12px]"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">Classe</label>
          <select
            value={value.travelClass}
            onChange={(e) =>
              onChange({
                ...value,
                travelClass: e.target.value as TicketDetailsInput["travelClass"],
              })
            }
            className="h-8 w-full rounded border border-neutral-200 bg-white px-2 text-[12px]"
          >
            {TRAVEL_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">De</label>
          <Input
            value={segment.from}
            onChange={(e) => updateSegment({ from: e.target.value })}
            placeholder="LBV"
            className="h-8 text-[12px]"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">Vers</label>
          <Input
            value={segment.to}
            onChange={(e) => updateSegment({ to: e.target.value })}
            placeholder="CDG"
            className="h-8 text-[12px]"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">
            Date de départ
          </label>
          <Input
            type="date"
            value={segment.date}
            onChange={(e) => updateSegment({ date: e.target.value })}
            className="h-8 text-[12px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">
            N° vol (optionnel)
          </label>
          <Input
            value={segment.flightNo ?? ""}
            onChange={(e) => updateSegment({ flightNo: e.target.value })}
            className="h-8 text-[12px]"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">Type</label>
          <select
            value={segment.tripType ?? "one_way"}
            onChange={(e) =>
              updateSegment({ tripType: e.target.value as "one_way" | "round_trip" })
            }
            className="h-8 w-full rounded border border-neutral-200 bg-white px-2 text-[12px]"
          >
            <option value="one_way">Aller simple</option>
            <option value="round_trip">Aller-retour</option>
          </select>
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">
            Prix fournisseur
          </label>
          <Input
            type="number"
            value={value.supplierPrice || ""}
            onChange={(e) => onChange({ ...value, supplierPrice: parseFloat(e.target.value) || 0 })}
            className="h-8 text-[12px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">
            PNR (optionnel)
          </label>
          <Input
            value={value.references?.pnr ?? ""}
            onChange={(e) =>
              onChange({ ...value, references: { ...value.references, pnr: e.target.value } })
            }
            className="h-8 text-[12px]"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">
            N° billet (optionnel)
          </label>
          <Input
            value={value.references?.ticketNumber ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                references: { ...value.references, ticketNumber: e.target.value },
              })
            }
            className="h-8 text-[12px]"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-neutral-600 mb-1">
            Réf. fournisseur (optionnel)
          </label>
          <Input
            value={value.references?.supplierReference ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                references: { ...value.references, supplierReference: e.target.value },
              })
            }
            className="h-8 text-[12px]"
          />
        </div>
      </div>
    </div>
  );
}
