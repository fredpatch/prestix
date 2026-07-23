import { db } from "../../db/index.js";
import { notificationPreferences } from "../../db/schema.js";
import { NOTIFICATION_EVENT_CODES } from "../../modules/notifications/services/notification.types.js";

// Human-readable label/description per event code — shown in the admin
// preferences UI. Defaults: in-app stays on (matches today's behavior for
// every existing producer), email starts off (email-per-event is a new
// capability this pass introduces; nothing should start emailing that
// wasn't already emailing before this seed runs).
const DEFAULTS: {
  eventCode: (typeof NOTIFICATION_EVENT_CODES)[number];
  label: string;
  description: string;
}[] = [
  {
    eventCode: "installment-due-soon",
    label: "Échéance proche (+3 jours)",
    description: "Une échéance de facture arrive à son terme dans les prochains jours.",
  },
  {
    eventCode: "proforma-expired",
    label: "Proforma expirée",
    description: "Une proforma a dépassé sa fenêtre de validité de 48h sans être promue.",
  },
  {
    eventCode: "penalties-accrued",
    label: "Pénalités de retard ajoutées",
    description: "Le calcul quotidien des échéances en retard a créé de nouvelles pénalités.",
  },
  {
    eventCode: "credit-auto-converted",
    label: "Crédit converti en épargne",
    description: "Des lots de crédit arrivés en fin de fenêtre ont été convertis automatiquement.",
  },
  {
    eventCode: "credit-held-review",
    label: "Crédit à vérifier manuellement",
    description: "Un lot de crédit est insuffisant pour ouvrir une épargne automatiquement.",
  },
  {
    eventCode: "commission-edit-requested",
    label: "Demande de modification de commission",
    description: "Une correction de commission attend une décision administrateur.",
  },
  {
    eventCode: "commission-edit-approved",
    label: "Modification de commission approuvée",
    description: "Une demande de correction de commission a été approuvée.",
  },
  {
    eventCode: "commission-edit-rejected",
    label: "Modification de commission refusée",
    description: "Une demande de correction de commission a été refusée.",
  },
];

// Idempotent — never overwrites a preference an admin already changed.
export async function seedNotificationPreferences(): Promise<void> {
  for (const pref of DEFAULTS) {
    await db
      .insert(notificationPreferences)
      .values({
        eventCode: pref.eventCode,
        label: pref.label,
        description: pref.description,
        inAppEnabled: true,
        emailEnabled: false,
      })
      .onConflictDoNothing({ target: notificationPreferences.eventCode });
  }
}
