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
  {
    key: "mail_enabled",
    value: "true",
    type: "boolean" as const,
    module: "MAIL",
    description: "Runtime switch for all outbound application emails",
  },
  {
    key: "mail_automatic_reminders_enabled",
    value: "false",
    type: "boolean" as const,
    module: "MAIL",
    description: "Allows scheduled invoice/installment reminder emails when enabled",
  },
  {
    key: "mail_document_auto_send_enabled",
    value: "false",
    type: "boolean" as const,
    module: "MAIL",
    description: "Allows generated proformas, invoices and delivery notes to be emailed automatically",
  },
  {
    key: "mail_sender_name",
    value: "PrestiX",
    type: "text" as const,
    module: "MAIL",
    description: "Display name used by generated emails when templates need it",
  },
  {
    key: "mail_owner_reminder_cc_enabled",
    value: "true",
    type: "boolean" as const,
    module: "MAIL",
    description:
      "When enabled, overdue-invoice reminder emails (manual or automatic) are also sent to every active admin/super_admin as an internal notice",
  },
  {
    key: "rewards_enabled",
    value: "true",
    type: "boolean" as const,
    module: "REWARDS",
    description: "Active la prévisualisation informative des récompenses, sans créer de paiement, crédit ou dette.",
  },
  {
    key: "rewards_client_enabled",
    value: "true",
    type: "boolean" as const,
    module: "REWARDS",
    description: "Inclut les clients dans le classement de prévisualisation des récompenses.",
  },
  {
    key: "rewards_client_threshold_gain",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Gain minimum en XAF avant qu'un client apparaisse comme éligible.",
  },
  {
    key: "rewards_client_rate_bps",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Taux de simulation client en points. 100 points = 1 %. Garder 0 tant que la règle n'est pas validée.",
  },
  {
    key: "rewards_client_fixed_amount",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Montant fixe en XAF ajouté à l'estimation client lorsqu'il est éligible.",
  },
  {
    key: "rewards_referrer_enabled",
    value: "true",
    type: "boolean" as const,
    module: "REWARDS",
    description: "Inclut les référents et apporteurs dans le classement de prévisualisation.",
  },
  {
    key: "rewards_referrer_threshold_gain",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Gain minimum en XAF avant qu'un référent apparaisse comme éligible.",
  },
  {
    key: "rewards_referrer_rate_bps",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Taux de simulation référent en points. 100 points = 1 %. Garder 0 tant que la règle n'est pas validée.",
  },
  {
    key: "rewards_referrer_fixed_amount",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Montant fixe en XAF ajouté à l'estimation référent lorsqu'il est éligible.",
  },
  {
    key: "rewards_employee_enabled",
    value: "true",
    type: "boolean" as const,
    module: "REWARDS",
    description: "Inclut les employés dans la comparaison interne des avantages ou primes possibles.",
  },
  {
    key: "rewards_employee_threshold_gain",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Gain minimum en XAF avant qu'un employé apparaisse comme éligible dans la simulation interne.",
  },
  {
    key: "rewards_employee_rate_bps",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Taux de simulation employé en points. 100 points = 1 %. Garder 0 tant que la règle n'est pas validée.",
  },
  {
    key: "rewards_employee_fixed_amount",
    value: "0",
    type: "integer" as const,
    module: "REWARDS",
    description: "Montant fixe en XAF ajouté à l'estimation employé lorsqu'il est éligible.",
  },
] satisfies (typeof settings.$inferInsert)[];

// Idempotent — never overwrites a value an admin already changed
export async function seedDefaultSettings(): Promise<void> {
  for (const s of DEFAULTS) {
    await db.insert(settings).values(s).onConflictDoNothing({ target: settings.key });
  }
}
