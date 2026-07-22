import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { mailOutbox } from "../../../db/schema.js";
import { sendMail } from "../../../utils/mailer.js";
import type {
  MailOutboxFilters,
  MailOutboxListResult,
  MailOutboxView,
  RetryableTemplateKey,
  SendTrackedMailInput,
  SendTrackedMailResult,
} from "./mail-outbox.types.js";
import { RETRYABLE_TEMPLATE_KEYS } from "./mail-outbox.types.js";

function toView(row: typeof mailOutbox.$inferSelect): MailOutboxView {
  return {
    id: row.id,
    notificationId: row.notificationId ?? undefined,
    recipient: row.recipient,
    subject: row.subject,
    templateKey: row.templateKey,
    status: row.status,
    sourceType: row.sourceType ?? undefined,
    sourceId: row.sourceId ?? undefined,
    messageId: row.messageId ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
    retryCount: row.retryCount,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    sentAt: row.sentAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Same fix as audit-log.service.ts / reporting.service.ts's endOfDay():
// new Date(params.to) parses as midnight UTC, silently excluding same-day
// rows from a `lte` comparison. Kept local rather than shared — a two-line
// date helper doesn't justify a cross-module dependency.
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export async function listMailOutbox(
  filters: MailOutboxFilters = {},
): Promise<MailOutboxListResult> {
  const page = filters.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (filters.status) conditions.push(eq(mailOutbox.status, filters.status));
  if (filters.templateKey) conditions.push(eq(mailOutbox.templateKey, filters.templateKey));
  if (filters.sourceType) conditions.push(eq(mailOutbox.sourceType, filters.sourceType));
  if (filters.recipient) conditions.push(ilike(mailOutbox.recipient, `%${filters.recipient}%`));
  if (filters.from) conditions.push(gte(mailOutbox.createdAt, new Date(filters.from)));
  if (filters.to) conditions.push(lte(mailOutbox.createdAt, endOfDay(filters.to)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(mailOutbox)
    .where(where)
    .orderBy(desc(mailOutbox.createdAt))
    .limit(pageSize)
    .offset(offset);

  const total = await db.$count(mailOutbox, where);

  return { data: rows.map(toView), total };
}

export async function getMailOutboxById(id: number): Promise<MailOutboxView | null> {
  const [row] = await db.select().from(mailOutbox).where(eq(mailOutbox.id, id)).limit(1);
  return row ? toView(row) : null;
}

// Backs the client's template filter dropdown — distinct values actually
// present in the table, same pattern as audit-log's listDistinctActions.
export async function listDistinctTemplateKeys(): Promise<string[]> {
  const rows = await db.selectDistinct({ templateKey: mailOutbox.templateKey }).from(mailOutbox);
  return rows.map((r) => r.templateKey).sort();
}

function isRetryableTemplateKey(key: string): key is RetryableTemplateKey {
  return (RETRYABLE_TEMPLATE_KEYS as readonly string[]).includes(key);
}

// Re-generates and re-sends the email from current document state, keyed by
// templateKey + sourceId — NOT a byte-for-byte replay of the original send.
// The original html/attachments were never persisted (mailOutbox only
// tracks metadata about each attempt, not content), so retry calls back
// into document-email.service.ts's own send functions. This means a retried
// email reflects the document's CURRENT state, not its state at the time of
// the original failed send — acceptable tradeoff vs. storing full email
// bodies/PDF attachments per outbox row.
//
// Deliberately restricted to status === "failed" rows (Pass 5 scope
// decision — a "sent" row already has an existing manual resend path via
// the document's own "Email facture" button).
//
// Dynamic import avoids a circular import: document-email.service.ts
// imports sendTrackedMail from this file, so a static top-level import
// of document-email.service.ts here would create a cycle.
export async function retryMailOutboxItem(
  id: number,
  requestedByUserId: number,
): Promise<SendTrackedMailResult> {
  const row = await getMailOutboxById(id);
  if (!row) throw new Error("MAIL_OUTBOX_ITEM_NOT_FOUND");
  if (row.status !== "failed") throw new Error("MAIL_OUTBOX_ITEM_NOT_FAILED");
  if (!row.sourceId || !isRetryableTemplateKey(row.templateKey)) {
    throw new Error("MAIL_OUTBOX_ITEM_NOT_RETRYABLE");
  }

  const sourceId = parseInt(row.sourceId, 10);
  if (Number.isNaN(sourceId)) throw new Error("MAIL_OUTBOX_ITEM_NOT_RETRYABLE");

  const documentEmail = await import("../../documents/services/document-email.service.js");
  const params = { id: sourceId, requestedByUserId, trigger: "manual" as const };

  switch (row.templateKey) {
    case "invoice_pdf":
      return documentEmail.sendInvoiceEmail(params);
    case "invoice_paid":
      return documentEmail.sendInvoicePaidEmail(params);
    case "invoice_overdue_reminder": {
      const daysOverdue =
        typeof row.metadata?.daysOverdue === "number" ? row.metadata.daysOverdue : 0;
      const result = await documentEmail.sendInvoiceReminderEmail({ ...params, daysOverdue });
      return result.client;
    }
    case "proforma_pdf":
      return documentEmail.sendProformaEmail(params);
    case "delivery_note_pdf":
      return documentEmail.sendDeliveryNoteEmail(params);
  }
}

export async function sendTrackedMail(
  input: SendTrackedMailInput,
): Promise<SendTrackedMailResult> {
  const [queued] = await db
    .insert(mailOutbox)
    .values({
      notificationId: input.notificationId,
      recipient: input.to,
      subject: input.subject,
      templateKey: input.templateKey ?? "manual",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      metadata: input.metadata,
    })
    .returning();

  try {
    const result = await sendMail({
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
    });

    const status = result.accepted.length > 0 ? "sent" : "failed";
    const [updated] = await db
      .update(mailOutbox)
      .set({
        status,
        messageId: result.messageId,
        errorMessage: status === "failed" ? "NO_RECIPIENT_ACCEPTED" : null,
        sentAt: status === "sent" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(mailOutbox.id, queued.id))
      .returning();

    return {
      success: status === "sent",
      outbox: toView(updated),
      accepted: result.accepted,
      rejected: result.rejected,
      messageId: result.messageId,
      errorMessage: status === "failed" ? "NO_RECIPIENT_ACCEPTED" : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "MAIL_SEND_FAILED";
    const [updated] = await db
      .update(mailOutbox)
      .set({ status: "failed", errorMessage, retryCount: 1, updatedAt: new Date() })
      .where(eq(mailOutbox.id, queued.id))
      .returning();

    return {
      success: false,
      outbox: toView(updated),
      accepted: [],
      rejected: [input.to],
      errorMessage,
    };
  }
}
