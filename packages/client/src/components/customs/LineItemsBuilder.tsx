import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/App";
import type { DocumentLineInput, TicketDetailsInput } from "@/lib/proforma.api";
import { TicketDetailsForm } from "./TicketDetailsForm";

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
  const canDiscount = user && ["manager", "admin", "super_admin"].includes(user.role);
  // New lines start expanded (need filling); track collapse state by index.
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  function addLine() {
    onChange([
      ...lines,
      { lineType: "ticket", description: "", quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  }

  function updateLine(index: number, patch: Partial<DocumentLineInput>) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function updateTicketDetails(index: number, ticketDetails: TicketDetailsInput) {
    onChange(
      lines.map((l, i) =>
        i === index ? { ...l, ticketDetails: { ...ticketDetails, sellingPrice: l.unitPrice } } : l,
      ),
    );
  }

  function defaultTicketDetails(unitPrice: number): TicketDetailsInput {
    return {
      travelClass: "economy",
      passengerName: "",
      segments: [{ from: "", to: "", date: "" }],
      supplierPrice: 0,
      sellingPrice: unitPrice,
    };
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
    setCollapsed((c) => {
      const next = { ...c };
      delete next[index];
      return next;
    });
  }

  function toggleCollapsed(index: number) {
    setCollapsed((c) => ({ ...c, [index]: !c[index] }));
  }

  const total = lines.reduce(
    (sum, l) => sum + (l.unitPrice ?? 0) * (l.quantity ?? 1) - (l.discount ?? 0),
    0,
  );

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const isCollapsed = collapsed[i];
        const summaryLabel =
          line.lineType === "ticket" && line.ticketDetails?.passengerName
            ? `${line.ticketDetails.passengerName} — ${line.ticketDetails.segments[0]?.from ?? "?"} → ${line.ticketDetails.segments[0]?.to ?? "?"}`
            : line.description || "(sans description)";
        const lineTotal = (line.unitPrice ?? 0) * (line.quantity ?? 1) - (line.discount ?? 0);

        if (isCollapsed) {
          return (
            <div
              key={i}
              className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 shrink-0">
                  {LINE_TYPES.find((t) => t.value === line.lineType)?.label}
                </span>
                <span className="text-[12px] text-neutral-800 truncate">{summaryLabel}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-medium text-neutral-800">
                  {lineTotal.toLocaleString("fr-FR")} XAF
                </span>
                <Button variant="ghost" size="icon" onClick={() => toggleCollapsed(i)}>
                  <ChevronDown size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(i)}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="bg-neutral-50 rounded-lg p-2.5">
            <div className="grid grid-cols-12 gap-2 items-start">
              <select
                value={line.lineType}
                onChange={(e) => {
                  const lineType = e.target.value as "ticket" | "shop";
                  updateLine(i, {
                    lineType,
                    quantity: lineType === "ticket" ? 1 : line.quantity,
                    ticketDetails:
                      lineType === "ticket"
                        ? (line.ticketDetails ?? defaultTicketDetails(line.unitPrice))
                        : undefined,
                  });
                }}
                className="col-span-2 h-9 rounded border border-neutral-200 bg-white px-2 text-[12px]"
              >
                {LINE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {line.lineType === "shop" && (
                <>
                  <Input
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    className={
                      canDiscount ? "col-span-4 h-9 text-[12px]" : "col-span-6 h-9 text-[12px]"
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={line.quantity ?? 1}
                    onChange={(e) => updateLine(i, { quantity: parseInt(e.target.value) || 1 })}
                    className="col-span-1 h-9 text-[12px]"
                    min={1}
                  />
                </>
              )}
              {line.lineType === "ticket" && (
                <div
                  className={
                    canDiscount
                      ? "col-span-5 h-9 flex items-center text-[9px] text-neutral-500 italic"
                      : "col-span-7 h-9 flex items-center text-[9px] text-neutral-500 italic"
                  }
                >
                  Description générée automatiquement (passager + trajet)
                </div>
              )}
              <Input
                type="number"
                placeholder="Prix unitaire"
                value={line.unitPrice}
                onChange={(e) => {
                  const unitPrice = parseFloat(e.target.value) || 0;
                  updateLine(i, {
                    unitPrice,
                    ticketDetails: line.ticketDetails
                      ? { ...line.ticketDetails, sellingPrice: unitPrice }
                      : undefined,
                  });
                }}
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
              <div className="col-span-2 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCollapsed(i)}
                  title="Réduire"
                >
                  <ChevronUp size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(i)}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
            {line.lineType === "ticket" && (
              <TicketDetailsForm
                value={line.ticketDetails ?? defaultTicketDetails(line.unitPrice)}
                onChange={(td) => updateTicketDetails(i, td)}
              />
            )}
          </div>
        );
      })}

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
