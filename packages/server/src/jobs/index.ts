// node-cron job registry. Examples to come: proforma 48h expiry (S3),
// penalty accrual (S5), credit-window auto-conversion (S9).
import cron from "node-cron";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db/index.js";
import { installments, invoices, mailOutbox } from "@/db/schema.js";
import { expireOverdueProformas } from "../modules/documents/services/proforma.service.js";
import { accrueOverduePenalties } from "@/modules/penalties/services/penalty.service.js";
import { convertExpiredCreditLots } from "@/modules/savings/services/savings-conversion.service.js";
import { broadcastNotification } from "@/modules/notifications/services/notification.service.js";
import { sendTrackedMail } from "@/modules/notifications/services/mail-outbox.service.js";
import { getBoolValue } from "@/modules/settings/services/settings.service.js";
import { sendInvoiceReminderEmail } from "@/modules/documents/services/document-email.service.js";

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function snapshotEmail(snapshot: unknown): string | undefined {
  return (snapshot as { email?: string } | undefined)?.email?.trim();
}

function snapshotName(snapshot: unknown): string {
  return (snapshot as { fullName?: string } | undefined)?.fullName ?? "client";
}

function formatMoney(value: string | number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Number(value))} XAF`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function notifyUpcomingInstallments(): Promise<number> {
  const today = new Date();
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);
  const shouldSendMail = await getBoolValue("mail_automatic_reminders_enabled", false);

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
      eventCode: "installment-due-soon",
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
      eventCode: "installment-due-soon",
      metadata,
    });

    const to = snapshotEmail(invoice.partySnapshot);
    if (shouldSendMail && to) {
      const invoiceNumber = invoice.number ?? `facture #${invoice.id}`;
      const buyer = snapshotName(invoice.partySnapshot);
      const reminderSourceId = `${installment.id}:${dateOnly(today)}`;
      const existingReminder = await db
        .select({ id: mailOutbox.id })
        .from(mailOutbox)
        .where(
          and(
            eq(mailOutbox.templateKey, "installment_due_reminder"),
            eq(mailOutbox.sourceType, "installments"),
            eq(mailOutbox.sourceId, reminderSourceId),
          ),
        )
        .limit(1);

      if (existingReminder.length > 0) continue;

      await sendTrackedMail({
        to,
        subject: `PrestiX - Rappel d'echeance ${invoiceNumber}`,
        text:
          `Bonjour ${buyer},\n\n` +
          `Nous vous rappelons que l'echeance ${installment.sequence} de la ${invoiceNumber} ` +
          `est prevue le ${installment.expectedDate} pour un montant attendu de ${formatMoney(
            installment.expectedAmount,
          )}.\n\nMerci de votre confiance.\nPrestiX`,
        html:
          `<p>Bonjour ${escapeHtml(buyer)},</p>` +
          `<p>Nous vous rappelons que l'echeance <strong>${installment.sequence}</strong> ` +
          `de la <strong>${escapeHtml(invoiceNumber)}</strong> est prevue le <strong>${installment.expectedDate}</strong>.</p>` +
          `<p>Montant attendu : <strong>${formatMoney(installment.expectedAmount)}</strong></p>` +
          "<p>Merci de votre confiance.</p>",
        templateKey: "installment_due_reminder",
        sourceType: "installments",
        sourceId: reminderSourceId,
        metadata: {
          ...metadata,
          automatic: true,
          reminderDate: dateOnly(today),
        },
      });
    }
  }

  return rows.length;
}

// Scenario #6 — automatic overdue reminder. Fires the client+owner reminder
// email (scenario #7's sendInvoiceReminderEmail, reused) once per calendar
// day per invoice, for any issued invoice with at least one unpaid/partial
// installment past its expectedDate. Distinct from notifyUpcomingInstallments
// (which fires BEFORE the due date) and from penalty accrual (which is a
// separate daily job on its own money-critical schedule) — this is purely
// the reminder-email side of "this invoice is late."
async function notifyOverdueInstallments(): Promise<number> {
  const shouldSendMail = await getBoolValue("mail_automatic_reminders_enabled", false);
  if (!shouldSendMail) return 0;

  const today = new Date();
  const rows = await db
    .select({ invoice: invoices })
    .from(installments)
    .innerJoin(invoices, eq(installments.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.status, "issued"),
        inArray(installments.status, ["unpaid", "partial"]),
        lte(installments.expectedDate, dateOnly(today)),
      ),
    );

  // One reminder per invoice per day, even if several installments are
  // overdue simultaneously — dedupe on invoice id, not installment id.
  const seenInvoiceIds = new Set<number>();
  let sent = 0;

  for (const { invoice } of rows) {
    if (invoice.paymentStatus === "paid") continue; // defensive; query already excludes fully-settled invoices in practice
    if (seenInvoiceIds.has(invoice.id)) continue;
    seenInvoiceIds.add(invoice.id);

    const to = snapshotEmail(invoice.partySnapshot);
    if (!to) continue;

    const dedupeSourceId = `${invoice.id}:${dateOnly(today)}`;
    const existingReminder = await db
      .select({ id: mailOutbox.id })
      .from(mailOutbox)
      .where(
        and(
          eq(mailOutbox.templateKey, "invoice_overdue_reminder"),
          eq(mailOutbox.sourceType, "invoices"),
          eq(mailOutbox.sourceId, dedupeSourceId),
        ),
      )
      .limit(1);
    if (existingReminder.length > 0) continue;

    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : today;
    const daysOverdue = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    try {
      await sendInvoiceReminderEmail({
        id: invoice.id,
        requestedByUserId: invoice.createdBy,
        trigger: "automatic",
        daysOverdue,
      });
      sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
      if (message !== "RECIPIENT_EMAIL_REQUIRED") {
        console.warn("[cron] overdue reminder failed for invoice", invoice.id, err);
      }
    }
  }

  return sent;
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
            eventCode: "proforma-expired",
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
            eventCode: "proforma-expired",
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
          eventCode: "penalties-accrued",
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
            eventCode: "credit-auto-converted",
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
            eventCode: "credit-held-review",
            metadata: { heldForReview },
          });
        }
      }
    } catch (err) {
      console.error("[cron] credit-window auto-conversion failed:", err);
    }
  });

  // Daily due-date reminder. In-app rows always run; customer email reminders
  // are guarded by the `mail_automatic_reminders_enabled` setting.
  cron.schedule("0 7 * * *", async () => {
    try {
      const count = await notifyUpcomingInstallments();
      if (count > 0) console.log(`[cron] ${count} installment reminder(s) queued`);
    } catch (err) {
      console.error("[cron] installment reminder failed:", err);
    }

    // Scenario #6 — overdue reminder, same daily slot right after the
    // due-soon reminder. Independent try/catch so a failure here never
    // blocks the due-soon reminder above (order matters: due-soon runs
    // first since it's the pre-existing behavior).
    try {
      const overdueCount = await notifyOverdueInstallments();
      if (overdueCount > 0) console.log(`[cron] ${overdueCount} overdue reminder(s) sent`);
    } catch (err) {
      console.error("[cron] overdue reminder job failed:", err);
    }
  });
}
