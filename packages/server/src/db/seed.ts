import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { featureFlags, commissionTypeCatalog, counters } from "./schema.js";

const MODULES = [
  "auth",
  "settings",
  "party",
  "documents",
  "payments",
  "penalties",
  "remises",
  "billetterie",
  "shop",
  "commission",
  "epargne",
  "dashboard",
  "papeterie", // ships hidden — V2
];

export async function seedFeatureFlags() {
  for (const moduleCode of MODULES) {
    const existing = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.moduleCode, moduleCode));
    if (existing.length > 0) continue;

    await db.insert(featureFlags).values({
      moduleCode,
      enabled: moduleCode !== "papeterie", // Papeterie hidden at launch
    });
  }
  console.log("[seed] feature_flags upserted (idempotent)");
}

const COMMISSION_TYPES: Array<{
  code: string;
  label: string;
  active: boolean;
  fieldSchema: Record<string, unknown>;
}> = [
  {
    code: "mobile_money",
    label: "Mobile Money",
    active: true,
    fieldSchema: { operateur: "string" },
  },
  {
    code: "transfert_change",
    label: "Transfert et Change",
    active: true,
    fieldSchema: {},
  },
  {
    code: "visa",
    label: "Visa",
    active: true,
    fieldSchema: {
      visaType: "enum:e-visa,visa-tampon",
      fournisseur: "string",
    },
  },
  {
    code: "location_voiture",
    label: "Location de Voiture",
    active: true,
    fieldSchema: { periode: "period" },
  },
  {
    code: "hebergement",
    label: "Hébergement",
    active: true,
    fieldSchema: { fournisseur: "string", periode: "period" },
  },
  {
    code: "assurance_voyage",
    label: "Assurance Voyage",
    active: true,
    fieldSchema: {
      fournisseur: "string",
      reference: "string?",
      periode: "period",
    },
  },
  {
    code: "canalplus",
    label: "Canal+",
    active: false, // V2 — seeded inactive
    fieldSchema: {},
  },
];

export async function seedCommissionTypes() {
  for (const type of COMMISSION_TYPES) {
    const existing = await db
      .select()
      .from(commissionTypeCatalog)
      .where(eq(commissionTypeCatalog.code, type.code));
    if (existing.length > 0) continue;

    await db.insert(commissionTypeCatalog).values({
      code: type.code,
      label: type.label,
      active: type.active,
      fieldSchema: type.fieldSchema,
    });
  }
  console.log("[seed] commission_type_catalog upserted (idempotent)");
}

export async function seedCounters() {
  for (const counterKey of ["INV", "PRO"]) {
    const existing = await db.select().from(counters).where(eq(counters.counterKey, counterKey));
    if (existing.length > 0) continue;

    await db.insert(counters).values({ counterKey, currentValue: 0 });
  }
  console.log("[seed] counters (INV, PRO) initialized");
}

async function main() {
  console.log("[seed] starting...");
  await seedFeatureFlags();
  await seedCommissionTypes();
  await seedCounters();
  console.log("[seed] done.");
  process.exit(0);
}

// Only self-run when executed directly (npm run db:seed), not when imported by index.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  });
}
