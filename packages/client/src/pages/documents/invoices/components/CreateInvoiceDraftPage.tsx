import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PartySelect } from "@/pages/documents/PartySelect";
import { invoiceApi } from "@/lib/invoice.api";
import type { DocumentLineInput } from "@/lib/proforma.api";
import type { Party } from "@/lib/party.api";
import { InvoiceLineItemsComposer } from "./InvoiceLineItemsComposer";
import { defaultTicketLine, type InvoiceFormValues } from "./invoice-form.types";
import { usePageHeader } from "@/components/layouts/lib/page-header";

const partySchema = z
  .custom<Party | null>((value) => value === null || (typeof value === "object" && value !== null))
  .nullable();

const ticketSchema = z.object({
  travelClass: z.enum(["economy", "business", "first", "premium"]),
  passengerName: z.string().trim().min(1, "Renseignez le nom du passager."),
  segments: z
    .array(
      z.object({
        from: z.string().trim().min(1, "Renseignez la ville de départ."),
        to: z.string().trim().min(1, "Renseignez la ville d'arrivée."),
        date: z.string().trim().min(1, "Renseignez la date de départ."),
        returnDate: z.string().optional(),
        flightNo: z.string().optional(),
        tripType: z.enum(["one_way", "round_trip"]).optional(),
      }),
    )
    .min(1),
  references: z
    .object({
      pnr: z.string().trim().min(1, "Renseignez le PNR."),
      gds: z.string().optional(),
      ticketNumber: z.string().optional(),
    })
    .optional(),
  supplierPrice: z.coerce.number().min(0, "Le prix fournisseur doit etre positif."),
  sellingPrice: z.coerce.number().min(1, "Renseignez le prix de vente."),
});

const shopSchema = z.object({
  articleId: z.number().optional(),
  supplierPrice: z.coerce.number().min(0, "Le prix fournisseur doit être positif.").optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  passengerName: z.string().optional(),
});

const lineSchema = z
  .object({
    lineType: z.enum(["ticket", "shop"]),
    description: z.string().optional().default(""),
    quantity: z.coerce.number().min(1, "La quantité doit être supérieure à zéro.").optional(),
    unitPrice: z.coerce.number().min(1, "Renseignez un prix."),
    discount: z.coerce.number().min(0, "La remise doit etre positive.").optional(),
    ticketDetails: ticketSchema.optional(),
    shopDetails: shopSchema.optional(),
  })
  .superRefine((line, ctx) => {
    const gross = line.unitPrice * (line.quantity ?? 1);
    if ((line.discount ?? 0) > gross) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La remise ne peut pas dépasser le total de la ligne.",
        path: ["discount"],
      });
    }

    if (line.lineType === "shop" && !line.description?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Renseignez la description de l'article.",
        path: ["description"],
      });
    }

    if (line.lineType === "ticket" && !line.ticketDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Renseignez les informations du billet.",
        path: ["ticketDetails"],
      });
    }
  });

const invoiceSchema = z.object({
  party: partySchema.refine((value) => value !== null, "Sélectionnez une partie."),
  referrer: partySchema,
  lines: z.array(lineSchema).min(1, "Ajoutez au moins une ligne."),
});

function buildTicketDescription(line: DocumentLineInput) {
  const ticket = line.ticketDetails;
  const segment = ticket?.segments[0];
  return `${ticket?.passengerName ?? "Passager"} - ${segment?.from ?? ""} vers ${
    segment?.to ?? ""
  }`.trim();
}

function SectionShell({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          {index}
        </p>
        <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">{title}</h2>
        <p className="mt-0.5 text-[11px] text-neutral-500">{description}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function CompletionRow({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[11.5px]">
      <span
        className={`flex size-4 items-center justify-center rounded-full border ${
          done
            ? "border-brand-gold-dark bg-brand-gold-dark text-white"
            : "border-neutral-300 bg-white text-neutral-300"
        }`}
      >
        {done && <Check size={10} />}
      </span>
      <span className={done ? "text-neutral-800" : "text-neutral-500"}>{label}</span>
    </li>
  );
}

function SummaryPanel({ values, isValid }: { values: InvoiceFormValues; isValid: boolean }) {
  const total = values.lines.reduce(
    (sum, line) => sum + (line.unitPrice || 0) * (line.quantity || 1) - (line.discount || 0),
    0,
  );
  const hasTicketReference = values.lines
    .filter((line) => line.lineType === "ticket")
    .every((line) => Boolean(line.ticketDetails?.references?.pnr));

  return (
    <aside className="border border-neutral-200 bg-white lg:sticky lg:top-6">
      <div className="border-b border-neutral-200 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Resume</p>
        <p className="mt-1 text-[20px] font-bold text-neutral-900">
          {total.toLocaleString("fr-FR")} XAF
        </p>
      </div>
      <div className="space-y-4 p-4">
        <ul className="space-y-2">
          <CompletionRow done={Boolean(values.party)} label="Partie selectionnee" />
          <CompletionRow done={values.lines.length > 0} label="Au moins une ligne ajoutée" />
          <CompletionRow done={hasTicketReference} label="PNR renseigné pour chaque billet" />
          <CompletionRow done={isValid} label="Formulaire prêt à créer" />
        </ul>
        <div className="flex items-start gap-2 border-t border-neutral-200 pt-3 text-[11px] text-neutral-500">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <p>La facture reste en brouillon (modifiable) jusqu'à son émission.</p>
        </div>
      </div>
    </aside>
  );
}

export default function CreateInvoiceDraftPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const methods = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: "onChange",
    defaultValues: {
      party: null,
      referrer: null,
      lines: [defaultTicketLine()],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = methods;
  const values = watch();

  usePageHeader({
    title: "Nouvelle facture (brouillon)",
    backTo: "/invoices",
    badge: `${values.lines.length} ligne${values.lines.length > 1 ? "s" : ""}`,
    helpTopic: "documents",
  });

  async function submit(formValues: InvoiceFormValues) {
    if (!formValues.party) return;
    setServerError(null);

    const finalLines = formValues.lines.map((line) =>
      line.lineType === "ticket" && line.ticketDetails
        ? {
            ...line,
            description: buildTicketDescription(line),
            quantity: 1,
            ticketDetails: {
              ...line.ticketDetails,
              sellingPrice: line.unitPrice,
            },
          }
        : line,
    );

    try {
      const res = await invoiceApi.createDraft(
        formValues.party.id,
        finalLines,
        formValues.referrer?.id,
      );
      navigate(`/invoices/${res.data.id}`);
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la création.",
      );
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(submit)} className="max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <SectionShell
              index="01 / Partie"
              title="Client et référent"
              description="Ces informations identifient la partie facturée et l'apporteur éventuel."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Controller
                  name="party"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label>Partie</Label>
                      <PartySelect value={field.value} onChange={field.onChange} />
                      <AnimatePresence>
                        {errors.party?.message && (
                          <motion.p
                            initial={{ opacity: 0, y: -3 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -3 }}
                            className="mt-1 text-[10.5px] text-red-600"
                          >
                            {errors.party.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                />
                <Controller
                  name="referrer"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label>Referent</Label>
                      <PartySelect
                        value={field.value}
                        onChange={field.onChange}
                        filterReferrer
                        placeholder="Rechercher un référent..."
                      />
                      <p className="mt-1 text-[10.5px] text-neutral-500">
                        Optionnel. Utilisé pour le suivi commercial.
                      </p>
                    </div>
                  )}
                />
              </div>
            </SectionShell>

            <InvoiceLineItemsComposer />

            <AnimatePresence>
              {(serverError || errors.lines?.message) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700"
                >
                  {serverError ?? errors.lines?.message}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
              <Button type="button" variant="secondary" onClick={() => navigate("/invoices")}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || !isValid}>
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  "Créer le brouillon"
                )}
              </Button>
            </div>
          </div>

          <SummaryPanel values={values} isValid={isValid} />
        </div>
      </form>
    </FormProvider>
  );
}
