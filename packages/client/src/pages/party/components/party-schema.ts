// packages/client/src/pages/party/components/party-schema.ts
import { z } from "zod";

export const partySchema = z
  .object({
    fullName: z.string().min(1, "Le nom complet est requis."),
    code: z.string().optional(),
    partyType: z.enum(["individual", "company"]),
    tradeName: z.string().optional(),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email invalide.").optional().or(z.literal("")),
    address: z.string().optional(),
    isClient: z.boolean(),
    isReferrer: z.boolean(),
  })
  .refine((v) => v.isClient || v.isReferrer, {
    message: "Une partie doit être au moins client ou référent.",
    path: ["isClient"],
  })
  .refine((v) => v.partyType !== "company" || !!v.tradeName?.trim(), {
    message: "La raison sociale est requise pour une partie de type société.",
    path: ["tradeName"],
  });

export type PartyFormValues = z.infer<typeof partySchema>;

export const PARTY_DEFAULTS: PartyFormValues = {
  fullName: "",
  code: "",
  partyType: "individual",
  tradeName: "",
  taxId: "",
  phone: "",
  email: "",
  address: "",
  isClient: true,
  isReferrer: false,
};

export function partyToValues(party: {
  fullName: string;
  code?: string | null;
  partyType: "individual" | "company";
  tradeName?: string | null;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isClient: boolean;
  isReferrer: boolean;
}): PartyFormValues {
  return {
    fullName: party.fullName,
    code: party.code ?? "",
    partyType: party.partyType,
    tradeName: party.tradeName ?? "",
    taxId: party.taxId ?? "",
    phone: party.phone ?? "",
    email: party.email ?? "",
    address: party.address ?? "",
    isClient: party.isClient,
    isReferrer: party.isReferrer,
  };
}
