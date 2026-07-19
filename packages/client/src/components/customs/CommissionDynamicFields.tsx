import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { CommissionDetails } from "@/lib/commission.api";

interface CommissionDynamicFieldsProps {
  // The active type's fieldSchema, e.g. { operateur: "string" } or
  // { visaType: "enum:e-visa,visa-tampon", fournisseur: "string" }. Built
  // once here, works for every type in the catalog - including any new type
  // a super_admin creates later through the catalog UI - without this
  // component ever needing a code change. That's the whole point of the
  // catalog being data-driven (M2) rather than a fixed TS union of types.
  fieldSchema: Record<string, string>;
  values: CommissionDetails;
  onChange: (values: CommissionDetails) => void;
}

function fieldLabel(key: string): string {
  // Cheap camelCase -> "Camel Case" - good enough for the known field names
  // (operateur, fournisseur, visaType, periode, reference); a super_admin
  // adding a custom field gets a readable-enough default label for free.
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function CommissionDynamicFields({
  fieldSchema,
  values,
  onChange,
}: CommissionDynamicFieldsProps) {
  const entries = Object.entries(fieldSchema);
  if (entries.length === 0) return null; // e.g. transfert_change - agent/date/amount only, nothing extra

  function updateField(key: string, value: string) {
    onChange({ ...values, [key]: value });
  }

  function updatePeriod(key: string, patch: Partial<{ start: string; end: string }>) {
    const current = (values[key] as { start: string; end: string } | undefined) ?? {
      start: "",
      end: "",
    };
    onChange({ ...values, [key]: { ...current, ...patch } });
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map(([key, fieldType]) => {
        // "enum:a,b,c" -> dropdown
        if (fieldType.startsWith("enum:")) {
          const options = fieldType.slice(5).split(",");
          return (
            <div key={key}>
              <Label>{fieldLabel(key)}</Label>
              <Select
                value={(values[key] as string) || undefined}
                onValueChange={(v) => updateField(key, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="— Sélectionner —" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        // "period" -> {start, end} date range
        if (fieldType === "period") {
          const period = (values[key] as { start: string; end: string } | undefined) ?? {
            start: "",
            end: "",
          };
          return (
            <div key={key} className="md:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <Label>{fieldLabel(key)} - début</Label>
                <Input
                  type="date"
                  value={period.start}
                  onChange={(e) => updatePeriod(key, { start: e.target.value })}
                />
              </div>
              <div>
                <Label>{fieldLabel(key)} - fin</Label>
                <Input
                  type="date"
                  value={period.end}
                  onChange={(e) => updatePeriod(key, { end: e.target.value })}
                />
              </div>
            </div>
          );
        }

        // "string" or "string?" -> plain text, "?" suffix just means optional
        // (no required-marker in the UI; server never enforces it either -
        // spec keeps all detail fields free-entry).
        const isOptional = fieldType.endsWith("?");
        return (
          <div key={key}>
            <Label>
              {fieldLabel(key)}{" "}
              {isOptional && <span className="text-neutral-400">(optionnel)</span>}
            </Label>
            <Input
              value={(values[key] as string) ?? ""}
              onChange={(e) => updateField(key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
