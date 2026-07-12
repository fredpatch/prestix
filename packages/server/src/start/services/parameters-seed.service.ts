import { db } from "../../db/index.js";
import { settings } from "../../db/schema.js";

const DEFAULTS = [
  {
    key: "penalty_amount_xaf",
    value: "2500",
    type: "integer" as const,
    module: "M6",
    description: "Flat penalty per full week late, per échéance",
  },
  {
    key: "penalty_grace_days",
    value: "7",
    type: "integer" as const,
    module: "M6",
    description: "Days after a missed échéance before penalty starts accruing",
  },
  {
    key: "credit_decision_period_days",
    value: "30",
    type: "integer" as const,
    module: "M3",
    description: "Window during which a client can decide what to do with a credit lot",
  },
  {
    key: "credit_underfee_policy",
    value: "HOLD_AND_NOTIFY",
    type: "text" as const,
    module: "M3",
    description: "Policy when a credit lot is smaller than the épargne inscription fee at expiry",
  },
  {
    key: "epargne_inscription_fee",
    value: "5000",
    type: "integer" as const,
    module: "M11",
    description: "Épargne Voyage inscription fee (XAF) — confirmed by Lucrèce, Sprint 0",
  },
  {
    key: "default_currency",
    value: "XAF",
    type: "text" as const,
    module: "M2",
    description: "Default currency, uppercase 3-letter code",
  },
  {
    key: "default_due_date_offset_days",
    value: "30",
    type: "integer" as const,
    module: "M2",
    description: "Default invoice due date offset when full-payment mode is chosen",
  },
  {
    key: "otp_expiration_minutes",
    value: "15",
    type: "integer" as const,
    module: "M1",
    description: "OTP code validity window in minutes",
  },
  {
    key: "lockout_max_attempts",
    value: "5",
    type: "integer" as const,
    module: "M1",
    description: "Failed login attempts before account lockout",
  },
  {
    key: "lockout_duration_minutes",
    value: "30",
    type: "integer" as const,
    module: "M1",
    description: "Account lockout duration after exceeding max attempts",
  },
] satisfies (typeof settings.$inferInsert)[];

// Idempotent — never overwrites a value an admin already changed
export async function seedDefaultSettings(): Promise<void> {
  for (const s of DEFAULTS) {
    await db.insert(settings).values(s).onConflictDoNothing({ target: settings.key });
  }
}
