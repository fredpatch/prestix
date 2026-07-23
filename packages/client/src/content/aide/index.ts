// Registry for the "Aide" (in-app manual) section. Content is static markdown,
// bundled client-side via Vite's `?raw` import (see packages/client/src/types/vite.d.ts).
// Deliberately NOT DB-backed yet — decided 2026-07-23: ship the mechanism now,
// revisit an editable/DB-backed version after prod deployment if content
// needs to be updated without a redeploy (tracked as a follow-up, not built here).

import partiesContent from "./parties.md?raw";
import documentsContent from "./documents.md?raw";
import paiementsContent from "./paiements.md?raw";
import creancesContent from "./creances.md?raw";
import stockContent from "./stock.md?raw";
import commissionsContent from "./commissions.md?raw";
import epargneContent from "./epargne.md?raw";
import dashboardContent from "./dashboard.md?raw";
import parametresContent from "./parametres.md?raw";
import utilisateursContent from "./utilisateurs.md?raw";
import notificationsContent from "./notifications.md?raw";
import auditLogContent from "./audit-log.md?raw";
import mailOutboxContent from "./mail-outbox.md?raw";
import errorCodesContent from "./error-codes.md?raw";

export type AideRole = "agent" | "manager" | "admin" | "super_admin";

export interface AideTopic {
  slug: string;
  title: string;
  moduleGroup: string; // sidebar section heading
  content: string | null; // null = not written yet, shows an empty state
  roles?: AideRole[]; // omitted = visible to everyone
}

// Sidebar section order. Every module gets an entry even if not yet written,
// so the page's structure communicates full future scope, not just what's done.
export const AIDE_TOPICS: AideTopic[] = [
  { slug: "parties", title: "Parties (clients & référents)", moduleGroup: "Parties", content: partiesContent },
  { slug: "documents", title: "Proformas, factures & BL", moduleGroup: "Documents", content: documentsContent },
  { slug: "paiements", title: "Paiements & échéancier", moduleGroup: "Documents", content: paiementsContent },
  { slug: "creances", title: "Créances & pénalités", moduleGroup: "Créances", content: creancesContent },
  { slug: "stock", title: "Stock & PrestiShop", moduleGroup: "Stock", content: stockContent },
  { slug: "commissions", title: "Commissions diverses", moduleGroup: "Commissions", content: commissionsContent },
  { slug: "epargne", title: "Épargne Voyage", moduleGroup: "Épargne", content: epargneContent },
  { slug: "dashboard", title: "Tableau de bord & Analyse", moduleGroup: "Reporting", content: dashboardContent },
  { slug: "parametres", title: "Paramètres", moduleGroup: "Administration", content: parametresContent },
  { slug: "utilisateurs", title: "Utilisateurs & rôles", moduleGroup: "Administration", content: utilisateursContent },
  { slug: "notifications", title: "Notifications", moduleGroup: "Notifications", content: notificationsContent },
  {
    slug: "audit-log",
    title: "Journal d'audit",
    moduleGroup: "Développeur / Super Admin",
    content: auditLogContent,
    roles: ["admin", "super_admin"],
  },
  {
    slug: "mail-outbox",
    title: "Historique emails",
    moduleGroup: "Développeur / Super Admin",
    content: mailOutboxContent,
    roles: ["admin", "super_admin"],
  },
  {
    slug: "codes-erreur",
    title: "Codes d'erreur (référence technique)",
    moduleGroup: "Développeur / Super Admin",
    content: errorCodesContent,
    roles: ["admin", "super_admin"],
  },
];

export function groupTopicsByModule(topics: AideTopic[]): Array<{ moduleGroup: string; topics: AideTopic[] }> {
  const order: string[] = [];
  const byGroup = new Map<string, AideTopic[]>();
  for (const topic of topics) {
    if (!byGroup.has(topic.moduleGroup)) {
      byGroup.set(topic.moduleGroup, []);
      order.push(topic.moduleGroup);
    }
    byGroup.get(topic.moduleGroup)!.push(topic);
  }
  return order.map((moduleGroup) => ({ moduleGroup, topics: byGroup.get(moduleGroup)! }));
}
