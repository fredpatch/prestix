import { desc, eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { mailOutbox } from "../../../db/schema.js";
import { sendMail } from "../../../utils/mailer.js";
import type {
  MailOutboxView,
  SendTrackedMailInput,
  SendTrackedMailResult,
} from "./mail-outbox.types.js";

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

export async function listMailOutbox(limit = 50): Promise<MailOutboxView[]> {
  const rows = await db
    .select()
    .from(mailOutbox)
    .orderBy(desc(mailOutbox.createdAt))
    .limit(Math.min(100, Math.max(1, limit)));
  return rows.map(toView);
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
