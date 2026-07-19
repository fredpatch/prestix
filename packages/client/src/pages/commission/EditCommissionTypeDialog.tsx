import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { commissionCatalogApi, type CommissionType } from "@/lib/commission-catalog.api";

interface EditCommissionTypeDialogProps {
  type: CommissionType;
  onUpdated: () => void;
}

// One editable row = one entry in the type's fieldSchema. "kind" is the
// friendly editor-side representation; serializeFieldSchema below converts it
// back to the actual string convention the backend/CommissionDynamicFields
// component expects ("string" / "string?" / "period" / "enum:a,b,c").
type FieldKind = "string" | "string_optional" | "period" | "enum";

interface FieldRow {
  key: string;
  kind: FieldKind;
  enumOptions: string; // raw comma-separated input, only meaningful when kind === "enum"
}

// fieldSchema -> editable rows. Anything that doesn't match a known
// convention falls back to "string" rather than silently dropping the field —
// better to show it as plain text than to lose it on the next save.
function parseFieldSchema(schema?: Record<string, string>): FieldRow[] {
  if (!schema) return [];
  return Object.entries(schema).map(([key, value]) => {
    if (value === "period") return { key, kind: "period" as const, enumOptions: "" };
    if (value === "string?") return { key, kind: "string_optional" as const, enumOptions: "" };
    if (value.startsWith("enum:")) return { key, kind: "enum" as const, enumOptions: value.slice(5) };
    return { key, kind: "string" as const, enumOptions: "" };
  });
}

// Editable rows -> fieldSchema, the inverse of parseFieldSchema above.
function serializeFieldSchema(rows: FieldRow[]): Record<string, string> {
  const schema: Record<string, string> = {};
  for (const row of rows) {
    if (!row.key.trim()) continue; // silently skip incomplete rows rather than rejecting the whole save
    if (row.kind === "period") schema[row.key] = "period";
    else if (row.kind === "string_optional") schema[row.key] = "string?";
    else if (row.kind === "enum") schema[row.key] = `enum:${row.enumOptions}`;
    else schema[row.key] = "string";
  }
  return schema;
}

export function EditCommissionTypeDialog({ type, onUpdated }: EditCommissionTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(type.label);
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-parse from the current type every time the dialog opens, so stale
  // edits from a previous open (never saved) don't linger.
  useEffect(() => {
    if (open) {
      setLabel(type.label);
      setRows(parseFieldSchema(type.fieldSchema));
      setError(null);
    }
  }, [open, type]);

  function addRow() {
    setRows([...rows, { key: "", kind: "string", enumOptions: "" }]);
  }

  function updateRow(index: number, patch: Partial<FieldRow>) {
    setRows(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await commissionCatalogApi.update(type.code, {
        label,
        fieldSchema: serializeFieldSchema(rows),
      });
      setOpen(false);
      onUpdated();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la modification.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" title="Modifier">
          <Pencil size={13} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier — {type.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Libellé</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Champs spécifiques à ce type</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus size={12} /> Ajouter un champ
              </Button>
            </div>
            <p className="text-[10.5px] text-neutral-500 mb-2">
              Note, date, montant, client et référent existent déjà pour tous les types — inutile de les
              rajouter ici.
            </p>

            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="bg-neutral-50 rounded-lg p-2.5 space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      placeholder="nom_du_champ"
                      value={row.key}
                      onChange={(e) => updateRow(i, { key: e.target.value })}
                      className="col-span-5 h-8 text-[12px]"
                    />
                    <Select value={row.kind} onValueChange={(v) => updateRow(i, { kind: v as FieldKind })}>
                      <SelectTrigger className="col-span-5 h-8 text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Texte</SelectItem>
                        <SelectItem value="string_optional">Texte optionnel</SelectItem>
                        <SelectItem value="period">Période (début/fin)</SelectItem>
                        <SelectItem value="enum">Liste déroulante</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(i)}
                      className="col-span-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  {row.kind === "enum" && (
                    <Input
                      placeholder="Options séparées par des virgules — ex: e-visa,visa-tampon"
                      value={row.enumOptions}
                      onChange={(e) => updateRow(i, { enumOptions: e.target.value })}
                      className="h-8 text-[12px]"
                    />
                  )}
                </div>
              ))}
              {rows.length === 0 && (
                <p className="text-[11px] text-neutral-400 italic">Aucun champ spécifique pour ce type.</p>
              )}
            </div>
          </div>

          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !label}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
