// node-cron job registry. Examples to come: proforma 48h expiry (S3),
// penalty accrual (S5), credit-window auto-conversion (S9).
import cron from "node-cron";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db/index.js";
import { installments, invoices } from "@/db/schema.js";
import { expireOverdueProformas } from "../modules/documents/services/proforma.service.js";
import { accrueOverduePenalties } from "@/modules/penalties/services/penalty.service.js";
import { convertExpiredCreditLots } from "@/modules/savings/services/savings-conversion.service.js";
import { broadcastNotification } from "@/modules/notifications/services/notification.service.js";

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function notifyUpcomingInstallments(): Promise<number> {
  const today = new Date();
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);

  const rows = await db
    .select({ installment: installments, invoice: invoices })
    .from(installments)
    .innerJoin(invoices, eq(installments.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.status, "issued"),
        inArray(installments.status, ["unpaid", "partial"]),
        gte(installments.expectedDate, dateOnly(today)),
        lte(installments.expectedDate, dateOnly(inThreeDays)),
      ),
    );

  for (const { installment, invoice } of rows) {
    const title = `Échéance ${invoice.number ?? `facture #${invoice.id}`} proche`;
    const body = `L'échéance ${installment.sequence} est prévue le ${installment.expectedDate}.`;
    const metadata = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      installmentId: installment.id,
      expectedDate: installment.expectedDate,
      expectedAmount: installment.expectedAmount,
    };

    await broadcastNotification({
      userIds: [invoice.createdBy],
      title,
      body,
      category: "finance",
      severity: "warning",
      sourceType: "installments",
      sourceId: String(installment.id),
      actionUrl: `/invoices/${invoice.id}`,
      dedupeKey: `installment-due-soon:${installment.id}:${installment.expectedDate}`,
      metadata,
    });

    await broadcastNotification({
      minRole: "manager",
      title,
      body,
      category: "finance",
      severity: "warning",
      sourceType: "installments",
      sourceId: String(installment.id),
      actionUrl: `/invoices/${invoice.id}`,
      dedupeKey: `installment-due-soon:${installment.id}:${installment.expectedDate}`,
      metadata,
    });
  }

  return rows.length;
}

// M4: proforma 48h expiry — runs every 15 minutes, flips overdue drafts to `expired`.
// No auto-cancel, just status — matches spec exactly.
export function registerJobs(): void {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const expired = await expireOverdueProformas();
      if (expired.length > 0) {
        console.log(`[cron] ${expired.length} proforma(s) expired`);
        for (const proforma of expired) {
          await broadcastNotification({
            userIds: [proforma.createdBy],
            title: `Proforma ${proforma.number} expirée`,
            body: "Cette proforma a dépassé sa fenêtre de validité de 48h.",
            category: "documents",
            severity: "warning",
            sourceType: "proformas",
            sourceId: String(proforma.id),
            actionUrl: `/proformas/${proforma.id}`,
            dedupeKey: `proforma-expired:${proforma.id}`,
            metadata: { number: proforma.number, partyId: proforma.partyId },
          });
          await broadcastNotification({
            minRole: "manager",
            title: `Proforma ${proforma.number} expirée`,
            body: "Une proforma est passée en statut expiré et ne peut plus être promue en facture.",
            category: "documents",
            severity: "warning",
            sourceType: "proformas",
            sourceId: String(proforma.id),
            actionUrl: `/proformas/${proforma.id}`,
            dedupeKey: `proforma-expired:${proforma.id}`,
            metadata: { number: proforma.number, partyId: proforma.partyId },
          });
        }
      }
    } catch (err) {
      console.error("[cron] proforma expiry failed:", err);
    }
  });

  // M6: penalty accrual — runs once daily at 00:05. Money-critical, no
  // manual waiver possible anywhere else in the system — this cron and
  // cancellation (voidPenaltiesForInvoice) are the only two paths that ever
  // touch a penalty row after creation.
  cron.schedule("5 0 * * *", async () => {
    try {
      const count = await accrueOverduePenalties();
      if (count > 0) {
        console.log(`[cron] ${count} penalty row(s) accrued`);
        await broadcastNotification({
          minRole: "manager",
          title: `${count} pénalité${count > 1 ? "s" : ""} ajoutée${count > 1 ? "s" : ""}`,
          body: "Le calcul quotidien des échéances en retard a créé de nouvelles pénalités.",
          category: "finance",
          severity: "danger",
          sourceType: "penalties",
          sourceId: new Date().toISOString().slice(0, 10),
          actionUrl: "/creances",
          dedupeKey: `penalties-accrued:${new Date().toISOString().slice(0, 10)}`,
          metadata: { count },
        });
      }
    } catch (err) {
      console.error("[cron] penalty accrual failed:", err);
    }
  });

  // Credit-window auto-conversion (S9) — runs once daily at 00:10, right
  // after penalty accrual. A credit lot's decision window expiring is a
  // similarly money-adjacent event; same daily cadence is appropriate, no
  // need for tighter polling.
  cron.schedule("10 0 * * *", async () => {
    try {
      const { converted, heldForReview } = await convertExpiredCreditLots();
      if (converted > 0 || heldForReview > 0) {
        console.log(`[cron] ${converted} credit lot(s) auto-converted, ${heldForReview} held for review`);
        if (converted > 0) {
          await broadcastNotification({
            minRole: "manager",
            title: `${converted} crédit${converted > 1 ? "s" : ""} converti${converted > 1 ? "s" : ""}`,
            body: "Des lots de crédit arrivés en fin de fenêtre ont été convertis en épargne voyage.",
            category: "savings",
            severity: "success",
            sourceType: "credit_lots",
            sourceId: new Date().toISOString().slice(0, 10),
            actionUrl: "/parties",
            dedupeKey: `credit-auto-converted:${new Date().toISOString().slice(0, 10)}`,
            metadata: { converted },
          });
        }
        if (heldForReview > 0) {
          await broadcastNotification({
            minRole: "manager",
            title: `${heldForReview} crédit${heldForReview > 1 ? "s" : ""} à vérifier`,
            body: "Un ou plusieurs lots de crédit sont insuffisants pour ouvrir une épargne automatiquement.",
            category: "savings",
            severity: "warning",
            sourceType: "credit_lots",
            sourceId: new Date().toISOString().slice(0, 10),
            actionUrl: "/parties",
            dedupeKey: `credit-held-review:${new Date().toISOString().slice(0, 10)}`,
            metadata: { heldForReview },
          });
        }
      }
    } catch (err) {
      console.error("[cron] credit-window auto-conversion failed:", err);
    }
  });

  // First in-app notification pass: daily due-date reminder. Email and
  // automatic reminder cadences will plug into this same notification model
  // later, but for now this only writes in-app rows.
  cron.schedule("0 7 * * *", async () => {
    try {
      const count = await notifyUpcomingInstallments();
      if (count > 0) console.log(`[cron] ${count} installment reminder(s) queued`);
    } catch (err) {
      console.error("[cron] installment reminder failed:", err);
    }
  });
}
