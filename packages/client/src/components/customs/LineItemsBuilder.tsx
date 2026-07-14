import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/App";
import type { DocumentLineInput } from "@/lib/proforma.api";

interface LineItemsBuilderProps {
  lines: DocumentLineInput[];
  onChange: (lines: DocumentLineInput[]) => void;
}

const LINE_TYPES: { value: "ticket" | "shop"; label: string }[] = [
  { value: "ticket", label: "Billetterie" },
  { value: "shop", label: "PrestiShop" },
];

export function LineItemsBuilder({ lines, onChange }: LineItemsBuilderProps) {
  const { user } = useAuth();
  // M7: discount is manager+ only — hide the field entirely for agents rather than
  // show a control that will just 403 on submit.
  const canDiscount = user && ["manager", "admin", "super_admin"].includes(user.role);

  function addLine() {
    onChange([
      ...lines,
      { lineType: "ticket", description: "", quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  }

  function updateLine(index: number, patch: Partial<DocumentLineInput>) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  const total = lines.reduce(
    (sum, l) => sum + (l.unitPrice ?? 0) * (l.quantity ?? 1) - (l.discount ?? 0),
    0,
  );

  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start bg-neutral-50 rounded-lg p-2.5">
          <select
            value={line.lineType}
            onChange={(e) => updateLine(i, { lineType: e.target.value as "ticket" | "shop" })}
            className="col-span-2 h-9 rounded border border-neutral-200 bg-white px-2 text-[12px]"
          >
            {LINE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => updateLine(i, { description: e.target.value })}
            className={canDiscount ? "col-span-4 h-9 text-[12px]" : "col-span-6 h-9 text-[12px]"}
          />
          <Input
            type="number"
            placeholder="Qté"
            value={line.quantity ?? 1}
            onChange={(e) => updateLine(i, { quantity: parseInt(e.target.value) || 1 })}
            className="col-span-1 h-9 text-[12px]"
            min={1}
          />
          <Input
            type="number"
            placeholder="Prix unitaire"
            value={line.unitPrice}
            onChange={(e) => updateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
            className="col-span-2 h-9 text-[12px]"
          />
          {canDiscount && (
            <Input
              type="number"
              placeholder="Remise"
              value={line.discount ?? 0}
              onChange={(e) => updateLine(i, { discount: parseFloat(e.target.value) || 0 })}
              className="col-span-2 h-9 text-[12px]"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeLine(i)}
            className="col-span-1 text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addLine}>
        <Plus size={13} /> Ajouter une ligne
      </Button>

      {lines.length > 0 && (
        <div className="flex justify-end pt-1">
          <span className="text-[12px] font-semibold text-neutral-800">
            Total : {total.toLocaleString("fr-FR")} XAF
          </span>
        </div>
      )}
    </div>
  );
}
