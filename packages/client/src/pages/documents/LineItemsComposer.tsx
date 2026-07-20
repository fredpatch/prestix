// Shared between InvoiceLineItemsComposer and ProformaLineItemsComposer.
// Previously two ~700-line files that were near-identical: the only real
// differences were the form-values type (InvoiceFormValues vs
// ProformaFormValues) and two label strings. Extracted as a generic
// component with a `contentLabel` prop for the one visible difference,
// and a FormValues generic for the type-level difference. Both composers
// are now ~20-line wrappers around this.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp, Plane, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, type FieldErrors, type FieldPath, type FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/App";
import type { DocumentLineInput, TicketDetailsInput } from "@/lib/proforma.api";
import { cn } from "@/lib/utils";
import { stockApi, type StockArticle } from "@/lib/stock.api";

// ── Constants ────────────────────────────────────────────────────────────────

export const LINE_TYPES = [
  { value: "ticket", label: "Billetterie", icon: Plane },
  { value: "shop", label: "PrestiShop", icon: ShoppingBag },
] as const;

export const TRAVEL_CLASSES: { value: TicketDetailsInput["travelClass"]; label: string }[] = [
  { value: "economy", label: "Économique (eco)" },
  { value: "business", label: "Affaires (bnss)" },
  { value: "first", label: "Première (prem)" },
  { value: "premium", label: "Premium (prm)" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[10.5px] text-red-600">{message}</p>;
}

export function lineSummary(line: DocumentLineInput): string {
  if (line.lineType === "ticket") {
    const ticket = line.ticketDetails;
    const segment = ticket?.segments[0];
    if (ticket?.passengerName || segment?.from || segment?.to) {
      return `${ticket?.passengerName || "Passager"} — ${segment?.from || "départ"} vers ${segment?.to || "arrivée"}`;
    }
    return "Billet à compléter";
  }
  return line.description || "Article à compléter";
}

export function lineTotal(line: DocumentLineInput): number {
  return (line.unitPrice || 0) * (line.quantity || 1) - (line.discount || 0);
}

// ── Path helpers — generic over the form values type ──────────────────────────

export function path<T extends FieldValues>(index: number, name: string): FieldPath<T> {
  return `lines.${index}.${name}` as FieldPath<T>;
}

export function ticketPath<T extends FieldValues>(index: number, name: string): FieldPath<T> {
  return `lines.${index}.ticketDetails.${name}` as FieldPath<T>;
}

export function firstSegmentPath<T extends FieldValues>(index: number, name: string): FieldPath<T> {
  return `lines.${index}.ticketDetails.segments.0.${name}` as FieldPath<T>;
}

export function referencePath<T extends FieldValues>(index: number, name: string): FieldPath<T> {
  return `lines.${index}.ticketDetails.references.${name}` as FieldPath<T>;
}

// ── defaultTicketDetails / defaultTicketLine / defaultShopLine ─────────────
// Exported so callers (the form-type modules) can use them.

export function defaultTicketDetails(unitPrice = 0): TicketDetailsInput {
  return {
    travelClass: "economy",
    passengerName: "",
    segments: [{ from: "", to: "", date: "", tripType: "one_way" }],
    references: { pnr: "", gds: "" },
    supplierPrice: 0,
    sellingPrice: unitPrice,
  };
}

export function defaultTicketLine(): DocumentLineInput {
  return {
    lineType: "ticket",
    description: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    ticketDetails: defaultTicketDetails(),
  };
}

export function defaultShopLine(): DocumentLineInput {
  return {
    lineType: "shop",
    description: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface ShopFieldsProps<T extends FieldValues> {
  index: number;
  line: DocumentLineInput;
}

export function ShopFields<T extends FieldValues>({ index, line }: ShopFieldsProps<T>) {
  const { setValue, watch } = useFormContext<T>();
  const allLines = watch("lines" as any) as DocumentLineInput[];
  const [articles, setArticles] = useState<StockArticle[]>([]);
  const [passengerMode, setPassengerMode] = useState<"dropdown" | "free">(
    line.shopDetails?.passengerName ? "free" : "dropdown",
  );

  useEffect(() => {
    stockApi.list().then((res) => setArticles(res.data));
  }, []);

  const ticketPassengers = allLines
    .filter((l) => l.lineType === "ticket" && l.ticketDetails?.passengerName)
    .map((l) => l.ticketDetails!.passengerName);

  const shop = line.shopDetails ?? { supplierPrice: 0, sellingPrice: line.unitPrice };
  const selectedArticle = shop.articleId ? articles.find((a) => a.id === shop.articleId) : undefined;
  const requestedQty = line.quantity ?? 1;
  const stockWarning =
    selectedArticle && requestedQty > selectedArticle.onHand
      ? `Stock insuffisant : ${selectedArticle.onHand} en stock, ${requestedQty} demandé${requestedQty > 1 ? "s" : ""}.`
      : null;

  function selectArticle(articleId: string | undefined) {
    if (!articleId) {
      setValue(`lines.${index}.shopDetails` as any, { ...shop, articleId: undefined } as any, { shouldDirty: true });
      return;
    }
    const article = articles.find((a) => a.id === Number(articleId));
    if (!article) return;
    const sellingPrice = parseFloat(article.defaultSellingPrice);
    const supplierPrice = parseFloat(article.defaultSupplierPrice);
    setValue(`lines.${index}.description` as any, article.name as any, { shouldDirty: true });
    setValue(`lines.${index}.unitPrice` as any, sellingPrice as any, { shouldDirty: true, shouldValidate: true });
    setValue(
      `lines.${index}.shopDetails` as any,
      { articleId: article.id, supplierPrice, sellingPrice, passengerName: shop.passengerName } as any,
      { shouldDirty: true },
    );
  }

  function updateShopField(patch: Partial<NonNullable<DocumentLineInput["shopDetails"]>>) {
    setValue(`lines.${index}.shopDetails` as any, { ...shop, ...patch } as any, { shouldDirty: true });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      className="mt-4 border-t border-neutral-200 pt-4"
    >
      <h3 className="text-[12px] font-semibold text-neutral-900 mb-3">Informations article</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Article (optionnel — laisser vide pour une prestation sans stock)</Label>
          <Select
            value={shop.articleId != null ? String(shop.articleId) : undefined}
            onValueChange={(v) => selectArticle(v === "__none__" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Aucun (prestation)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Aucun (prestation)</SelectItem>
              {articles.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name} — {a.onHand} {a.unit} en stock
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prix fournisseur</Label>
          <Input
            type="number"
            value={shop.supplierPrice || ""}
            onChange={(e) => updateShopField({ supplierPrice: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      {stockWarning && (
        <p className="mt-2 flex gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>
            {stockWarning} — l'émission de la facture nécessitera l'autorisation d'un manager si le
            stock ne change pas d'ici là.
          </span>
        </p>
      )}

      <div className="mt-4">
        <Label>Passager désigné (optionnel)</Label>
        {passengerMode === "dropdown" && ticketPassengers.length > 0 ? (
          <div className="flex gap-2">
            <Select
              value={shop.passengerName || undefined}
              onValueChange={(v) => updateShopField({ passengerName: v })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="— Sélectionner —" />
              </SelectTrigger>
              <SelectContent>
                {ticketPassengers.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={() => setPassengerMode("free")}>
              Autre
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={shop.passengerName ?? ""}
              onChange={(e) => updateShopField({ passengerName: e.target.value })}
              placeholder="Nom du client"
            />
            {ticketPassengers.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPassengerMode("dropdown")}>
                Liste
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TicketFieldsProps<T extends FieldValues> {
  index: number;
  line: DocumentLineInput;
  error?: FieldErrors<DocumentLineInput>;
}

export function TicketFields<T extends FieldValues>({ index, line, error }: TicketFieldsProps<T>) {
  const { register, setValue } = useFormContext<T>();
  const ticket = line.ticketDetails ?? defaultTicketDetails(line.unitPrice);
  const segment = ticket.segments[0] ?? { from: "", to: "", date: "", tripType: "one_way" };
  const isRoundTrip = segment.tripType === "round_trip";
  const ticketError = error?.ticketDetails as FieldErrors<TicketDetailsInput> | undefined;
  const segmentError = ticketError?.segments?.[0] as FieldErrors<TicketDetailsInput["segments"][0]> | undefined;
  const referenceError = ticketError?.references as FieldErrors<NonNullable<TicketDetailsInput["references"]>> | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      className="mt-4 border-t border-neutral-200 pt-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-semibold text-neutral-900">Informations billet</h3>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Ces champs génèrent la description de la ligne et les références du dossier.
          </p>
        </div>
        <span className="rounded border border-neutral-200 bg-white px-2 py-1 text-[10.5px] font-medium text-neutral-500">
          Ligne {index + 1}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor={`passenger-${index}`}>Nom du passager</Label>
          <Input
            id={`passenger-${index}`}
            placeholder="Nom complet sur le billet"
            {...register(ticketPath<T>(index, "passengerName"))}
          />
          <FieldError message={ticketError?.passengerName?.message as string | undefined} />
        </div>
        <div>
          <Label>Classe de voyage</Label>
          <Select
            value={ticket.travelClass}
            onValueChange={(value) =>
              setValue(ticketPath<T>(index, "travelClass"), value as TicketDetailsInput["travelClass"] as any, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir une classe" />
            </SelectTrigger>
            <SelectContent>
              {TRAVEL_CLASSES.map((tc) => (
                <SelectItem key={tc.value} value={tc.value}>
                  {tc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={ticketError?.travelClass?.message as string | undefined} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor={`from-${index}`}>Ville de départ</Label>
          <Input id={`from-${index}`} placeholder="Ex. Libreville" {...register(firstSegmentPath<T>(index, "from"))} />
          <FieldError message={segmentError?.from?.message as string | undefined} />
        </div>
        <div>
          <Label htmlFor={`to-${index}`}>Ville d'arrivée</Label>
          <Input id={`to-${index}`} placeholder="Ex. Paris" {...register(firstSegmentPath<T>(index, "to"))} />
          <FieldError message={segmentError?.to?.message as string | undefined} />
        </div>
        <div>
          <Label>Type de trajet</Label>
          <Select
            value={segment.tripType ?? "one_way"}
            onValueChange={(value) =>
              setValue(firstSegmentPath<T>(index, "tripType"), value as "one_way" | "round_trip" as any, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Type de trajet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_way">Aller simple</SelectItem>
              <SelectItem value="round_trip">Aller-retour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={cn("mt-4 grid gap-3", isRoundTrip ? "md:grid-cols-2" : "md:grid-cols-1")}>
        <div>
          <Label htmlFor={`date-${index}`}>Date de départ</Label>
          <Input id={`date-${index}`} type="date" {...register(firstSegmentPath<T>(index, "date"))} />
          <FieldError message={segmentError?.date?.message as string | undefined} />
        </div>
        <AnimatePresence initial={false}>
          {isRoundTrip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Label htmlFor={`return-${index}`}>Date de retour</Label>
              <Input id={`return-${index}`} type="date" {...register(firstSegmentPath<T>(index, "returnDate"))} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor={`flight-${index}`}>Numero de vol</Label>
          <Input id={`flight-${index}`} placeholder="Optionnel" {...register(firstSegmentPath<T>(index, "flightNo"))} />
        </div>
        <div>
          <Label htmlFor={`supplier-${index}`}>Prix fournisseur</Label>
          <Input
            id={`supplier-${index}`}
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            {...register(ticketPath<T>(index, "supplierPrice"), { valueAsNumber: true })}
          />
          <FieldError message={ticketError?.supplierPrice?.message as string | undefined} />
        </div>
        <div>
          <Label htmlFor={`selling-${index}`}>Prix de vente</Label>
          <Input
            id={`selling-${index}`}
            type="number"
            min={0}
            step="0.01"
            value={line.unitPrice || ""}
            onChange={(event) => {
              const unitPrice = parseFloat(event.target.value) || 0;
              setValue(path<T>(index, "unitPrice"), unitPrice as any, { shouldDirty: true, shouldValidate: true });
              setValue(ticketPath<T>(index, "sellingPrice"), unitPrice as any, { shouldDirty: true, shouldValidate: true });
            }}
            placeholder="Montant facture"
          />
          <FieldError message={error?.unitPrice?.message as string | undefined} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor={`pnr-${index}`}>PNR</Label>
          <Input id={`pnr-${index}`} placeholder="Reference dossier" {...register(referencePath<T>(index, "pnr"))} />
          <FieldError message={referenceError?.pnr?.message as string | undefined} />
        </div>
        <div>
          <Label htmlFor={`gds-${index}`}>GDS</Label>
          <Input id={`gds-${index}`} placeholder="Amadeus, Sabre..." {...register(referencePath<T>(index, "gds"))} />
        </div>
        <div>
          <Label htmlFor={`ticket-number-${index}`}>Numero de billet</Label>
          <Input id={`ticket-number-${index}`} placeholder="Optionnel" {...register(referencePath<T>(index, "ticketNumber"))} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main shared composer ───────────────────────────────────────────────────────

interface LineItemsComposerProps<T extends FieldValues> {
  // The one visible difference between invoice and proforma composers.
  contentLabel: string;
}

export function LineItemsComposer<T extends FieldValues>({ contentLabel }: LineItemsComposerProps<T>) {
  const { user } = useAuth();
  const canDiscount = user && ["manager", "admin", "super_admin"].includes(user.role);
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<T>();
  const { fields, append, remove } = useFieldArray({ control, name: "lines" as any });
  const lines = watch("lines" as any) as DocumentLineInput[];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function setLineType(index: number, value: "ticket" | "shop") {
    const current = lines[index];
    if (value === "ticket") {
      setValue(`lines.${index}` as any, {
        ...current,
        lineType: "ticket",
        quantity: 1,
        description: current.description ?? "",
        ticketDetails: current.ticketDetails ?? defaultTicketDetails(current.unitPrice),
      } as any);
      return;
    }
    setValue(`lines.${index}` as any, {
      ...current,
      lineType: "shop",
      ticketDetails: undefined,
      description: current.description ?? "",
      quantity: current.quantity ?? 1,
    } as any);
  }

  return (
    <section className="border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">02 / Lignes</p>
            <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">{contentLabel}</h2>
          </div>
          <Button type="button" size="sm" onClick={() => append(defaultTicketLine() as any)}>
            <Plus size={13} /> Ajouter une ligne
          </Button>
        </div>
      </div>

      <div className="divide-y divide-neutral-200">
        <AnimatePresence initial={false}>
          {fields.map((field, index) => {
            const line = lines[index] ?? defaultTicketLine();
            const selectedType = LINE_TYPES.find((type) => type.value === line.lineType);
            const LineIcon = selectedType?.icon ?? Plane;
            const isCollapsed = collapsed[field.id];
            const error = (errors as any).lines?.[index] as FieldErrors<DocumentLineInput> | undefined;

            return (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-brand-gold-dark">
                      <LineIcon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-neutral-900">Ligne {index + 1}</p>
                        <span className="text-[10.5px] font-medium text-neutral-500">{selectedType?.label}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-500">{lineSummary(line)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-1 hidden text-[12px] font-semibold text-neutral-800 sm:inline">
                      {lineTotal(line).toLocaleString("fr-FR")} XAF
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCollapsed((state) => ({ ...state, [field.id]: !isCollapsed }))}
                      title={isCollapsed ? "Développer" : "Réduire"}
                    >
                      {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:bg-red-50"
                      title="Supprimer la ligne"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-3">
                          <Label>Type de ligne</Label>
                          <Select
                            value={line.lineType}
                            onValueChange={(value) => setLineType(index, value as "ticket" | "shop")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {LINE_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {line.lineType === "shop" && (
                          <>
                            <div className={cn(canDiscount ? "md:col-span-4" : "md:col-span-5")}>
                              <Label htmlFor={`description-${index}`}>Description article</Label>
                              <Input
                                id={`description-${index}`}
                                placeholder="Article ou service vendu"
                                {...register(path<T>(index, "description"))}
                              />
                              <FieldError message={error?.description?.message as string | undefined} />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor={`quantity-${index}`}>Quantité</Label>
                              <Input
                                id={`quantity-${index}`}
                                type="number"
                                min={1}
                                {...register(path<T>(index, "quantity"), { valueAsNumber: true })}
                              />
                              <FieldError message={error?.quantity?.message as string | undefined} />
                            </div>
                          </>
                        )}

                        {line.lineType === "shop" && (
                          <div className="md:col-span-2">
                            <Label htmlFor={`unit-price-${index}`}>Prix unitaire</Label>
                            <Input
                              id={`unit-price-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              {...register(path<T>(index, "unitPrice"), { valueAsNumber: true })}
                            />
                            <FieldError message={error?.unitPrice?.message as string | undefined} />
                          </div>
                        )}

                        {canDiscount && (
                          <div className="md:col-span-2">
                            <Label htmlFor={`discount-${index}`}>Remise</Label>
                            <Input
                              id={`discount-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              {...register(path<T>(index, "discount"), { valueAsNumber: true })}
                            />
                            <FieldError message={error?.discount?.message as string | undefined} />
                          </div>
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {line.lineType === "ticket" && (
                          <TicketFields<T> index={index} line={line} error={error} />
                        )}
                        {line.lineType === "shop" && <ShopFields<T> index={index} line={line} />}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {fields.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] font-medium text-neutral-800">Aucune ligne ajoutée.</p>
            <p className="mt-1 text-[11px] text-neutral-500">
              Ajoutez une ligne billetterie ou PrestiShop pour continuer.
            </p>
            <Button type="button" size="sm" className="mt-3" onClick={() => append(defaultTicketLine() as any)}>
              <Plus size={13} /> Ajouter une ligne
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
        <Button type="button" variant="outline" size="sm" onClick={() => append(defaultShopLine() as any)}>
          <Plus size={13} /> Ligne PrestiShop
        </Button>
        <p className="text-[12px] font-semibold text-neutral-900">
          Total lignes :{" "}
          {lines.reduce((sum, line) => sum + lineTotal(line), 0).toLocaleString("fr-FR")} XAF
        </p>
      </div>
    </section>
  );
}
