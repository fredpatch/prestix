import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Plane, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, type FieldErrors, type FieldPath } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/App";
import type { DocumentLineInput, TicketDetailsInput } from "@/lib/proforma.api";
import { cn } from "@/lib/utils";
import {
  defaultShopLine,
  defaultTicketDetails,
  defaultTicketLine,
  type InvoiceFormValues,
} from "./invoice-form.types";
import { stockApi, StockArticle } from "@/lib/stock.api";

const LINE_TYPES = [
  { value: "ticket", label: "Billetterie", icon: Plane },
  { value: "shop", label: "PrestiShop", icon: ShoppingBag },
] as const;

const TRAVEL_CLASSES: { value: TicketDetailsInput["travelClass"]; label: string }[] = [
  { value: "economy", label: "Économique (eco)" },
  { value: "business", label: "Affaires (bnss)" },
  { value: "first", label: "Première (prem)" },
  { value: "premium", label: "Premium (prm)" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[10.5px] text-red-600">{message}</p>;
}

function path(index: number, name: string) {
  return `lines.${index}.${name}` as FieldPath<InvoiceFormValues>;
}

function ticketPath(index: number, name: string) {
  return `lines.${index}.ticketDetails.${name}` as FieldPath<InvoiceFormValues>;
}

function firstSegmentPath(index: number, name: string) {
  return `lines.${index}.ticketDetails.segments.0.${name}` as FieldPath<InvoiceFormValues>;
}

function referencePath(index: number, name: string) {
  return `lines.${index}.ticketDetails.references.${name}` as FieldPath<InvoiceFormValues>;
}

function lineSummary(line: DocumentLineInput) {
  if (line.lineType === "ticket") {
    const ticket = line.ticketDetails;
    const segment = ticket?.segments[0];
    if (ticket?.passengerName || segment?.from || segment?.to) {
      return `${ticket?.passengerName || "Passager"} - ${segment?.from || "départ"} vers ${
        segment?.to || "arrivée"
      }`;
    }
    return "Billet à compléter";
  }
  return line.description || "Article à compléter";
}

function lineTotal(line: DocumentLineInput) {
  return (line.unitPrice || 0) * (line.quantity || 1) - (line.discount || 0);
}

interface ShopFieldsProps {
  index: number;
  line: DocumentLineInput;
}

function ShopFields({ index, line }: ShopFieldsProps) {
  const { setValue, watch } = useFormContext<InvoiceFormValues>();
  const allLines = watch("lines");
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

  function selectArticle(articleId: string) {
    if (!articleId) {
      setValue(
        `lines.${index}.shopDetails` as any,
        { ...shop, articleId: undefined },
        { shouldDirty: true },
      );
      return;
    }
    const article = articles.find((a) => a.id === Number(articleId));
    if (!article) return;
    const sellingPrice = parseFloat(article.defaultSellingPrice);
    const supplierPrice = parseFloat(article.defaultSupplierPrice);
    setValue(`lines.${index}.description` as any, article.name, { shouldDirty: true });
    setValue(`lines.${index}.unitPrice` as any, sellingPrice, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      `lines.${index}.shopDetails` as any,
      { articleId: article.id, supplierPrice, sellingPrice, passengerName: shop.passengerName },
      { shouldDirty: true },
    );
  }

  function updateShopField(patch: Partial<NonNullable<DocumentLineInput["shopDetails"]>>) {
    setValue(`lines.${index}.shopDetails` as any, { ...shop, ...patch }, { shouldDirty: true });
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
          <select
            value={shop.articleId ?? ""}
            onChange={(e) => selectArticle(e.target.value)}
            className="flex h-10 w-full rounded border border-neutral-200 bg-white px-3 text-sm"
          >
            <option value="">Aucun (prestation)</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.onHand} {a.unit} en stock
              </option>
            ))}
          </select>
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

      <div className="mt-4">
        <Label>Passager désigné (optionnel)</Label>
        {passengerMode === "dropdown" && ticketPassengers.length > 0 ? (
          <div className="flex gap-2">
            <select
              value={shop.passengerName ?? ""}
              onChange={(e) => updateShopField({ passengerName: e.target.value })}
              className="flex h-10 flex-1 rounded border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="">— Sélectionner —</option>
              {ticketPassengers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPassengerMode("free")}
            >
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPassengerMode("dropdown")}
              >
                Liste
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TicketFieldsProps {
  index: number;
  line: DocumentLineInput;
  error?: FieldErrors<DocumentLineInput>;
}

function TicketFields({ index, line, error }: TicketFieldsProps) {
  const { register, setValue } = useFormContext<InvoiceFormValues>();
  const ticket = line.ticketDetails ?? defaultTicketDetails(line.unitPrice);
  const segment = ticket.segments[0] ?? { from: "", to: "", date: "", tripType: "one_way" };
  const isRoundTrip = segment.tripType === "round_trip";
  const ticketError = error?.ticketDetails as FieldErrors<TicketDetailsInput> | undefined;
  const segmentError = ticketError?.segments?.[0] as
    FieldErrors<TicketDetailsInput["segments"][0]> | undefined;
  const referenceError = ticketError?.references as
    FieldErrors<NonNullable<TicketDetailsInput["references"]>> | undefined;

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
            {...register(ticketPath(index, "passengerName"))}
          />
          <FieldError message={ticketError?.passengerName?.message as string | undefined} />
        </div>
        <div>
          <Label>Classe de voyage</Label>
          <Select
            value={ticket.travelClass}
            onValueChange={(value) =>
              setValue(
                ticketPath(index, "travelClass"),
                value as TicketDetailsInput["travelClass"],
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir une classe" />
            </SelectTrigger>
            <SelectContent>
              {TRAVEL_CLASSES.map((travelClass) => (
                <SelectItem key={travelClass.value} value={travelClass.value}>
                  {travelClass.label}
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
          <Input
            id={`from-${index}`}
            placeholder="Ex. Libreville"
            {...register(firstSegmentPath(index, "from"))}
          />
          <FieldError message={segmentError?.from?.message as string | undefined} />
        </div>
        <div>
          <Label htmlFor={`to-${index}`}>Ville d'arrivée</Label>
          <Input
            id={`to-${index}`}
            placeholder="Ex. Paris"
            {...register(firstSegmentPath(index, "to"))}
          />
          <FieldError message={segmentError?.to?.message as string | undefined} />
        </div>
        <div>
          <Label>Type de trajet</Label>
          <Select
            value={segment.tripType ?? "one_way"}
            onValueChange={(value) =>
              setValue(firstSegmentPath(index, "tripType"), value as "one_way" | "round_trip", {
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
          <Input id={`date-${index}`} type="date" {...register(firstSegmentPath(index, "date"))} />
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
              <Input
                id={`return-${index}`}
                type="date"
                {...register(firstSegmentPath(index, "returnDate"))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor={`flight-${index}`}>Numero de vol</Label>
          <Input
            id={`flight-${index}`}
            placeholder="Optionnel"
            {...register(firstSegmentPath(index, "flightNo"))}
          />
        </div>
        <div>
          <Label htmlFor={`supplier-${index}`}>Prix fournisseur</Label>
          <Input
            id={`supplier-${index}`}
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            {...register(ticketPath(index, "supplierPrice"), { valueAsNumber: true })}
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
              setValue(path(index, "unitPrice"), unitPrice, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue(ticketPath(index, "sellingPrice"), unitPrice, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            placeholder="Montant facture"
          />
          <FieldError message={error?.unitPrice?.message as string | undefined} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor={`pnr-${index}`}>PNR</Label>
          <Input
            id={`pnr-${index}`}
            placeholder="Reference dossier"
            {...register(referencePath(index, "pnr"))}
          />
          <FieldError message={referenceError?.pnr?.message as string | undefined} />
        </div>
        <div>
          <Label htmlFor={`gds-${index}`}>GDS</Label>
          <Input
            id={`gds-${index}`}
            placeholder="Amadeus, Sabre..."
            {...register(referencePath(index, "gds"))}
          />
        </div>
        <div>
          <Label htmlFor={`ticket-number-${index}`}>Numero de billet</Label>
          <Input
            id={`ticket-number-${index}`}
            placeholder="Optionnel"
            {...register(referencePath(index, "ticketNumber"))}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function InvoiceLineItemsComposer() {
  const { user } = useAuth();
  const canDiscount = user && ["manager", "admin", "super_admin"].includes(user.role);
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function setLineType(index: number, value: "ticket" | "shop") {
    const current = lines[index];
    if (value === "ticket") {
      setValue(`lines.${index}` as FieldPath<InvoiceFormValues>, {
        ...current,
        lineType: "ticket",
        quantity: 1,
        description: current.description ?? "",
        ticketDetails: current.ticketDetails ?? defaultTicketDetails(current.unitPrice),
      });
      return;
    }

    setValue(`lines.${index}` as FieldPath<InvoiceFormValues>, {
      ...current,
      lineType: "shop",
      ticketDetails: undefined,
      description: current.description ?? "",
      quantity: current.quantity ?? 1,
    });
  }

  return (
    <section className="border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              02 / Lignes
            </p>
            <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">
              Contenu de la facture
            </h2>
          </div>
          <Button type="button" size="sm" onClick={() => append(defaultTicketLine())}>
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
            const error = errors.lines?.[index] as FieldErrors<DocumentLineInput> | undefined;

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
                        <p className="text-[13px] font-semibold text-neutral-900">
                          Ligne {index + 1}
                        </p>
                        <span className="text-[10.5px] font-medium text-neutral-500">
                          {selectedType?.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                        {lineSummary(line)}
                      </p>
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
                      onClick={() =>
                        setCollapsed((state) => ({ ...state, [field.id]: !isCollapsed }))
                      }
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
                            onValueChange={(value) =>
                              setLineType(index, value as "ticket" | "shop")
                            }
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
                                {...register(path(index, "description"))}
                              />
                              <FieldError
                                message={error?.description?.message as string | undefined}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor={`quantity-${index}`}>Quantité</Label>
                              <Input
                                id={`quantity-${index}`}
                                type="number"
                                min={1}
                                {...register(path(index, "quantity"), { valueAsNumber: true })}
                              />
                              <FieldError
                                message={error?.quantity?.message as string | undefined}
                              />
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
                              {...register(path(index, "unitPrice"), { valueAsNumber: true })}
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
                              {...register(path(index, "discount"), { valueAsNumber: true })}
                            />
                            <FieldError message={error?.discount?.message as string | undefined} />
                          </div>
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {line.lineType === "ticket" && (
                          <TicketFields index={index} line={line} error={error} />
                        )}
                        {line.lineType === "shop" && <ShopFields index={index} line={line} />}
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
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() => append(defaultTicketLine())}
            >
              <Plus size={13} /> Ajouter une ligne
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
        <Button type="button" variant="outline" size="sm" onClick={() => append(defaultShopLine())}>
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
