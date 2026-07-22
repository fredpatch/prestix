import type { SendMailOptions } from "nodemailer";

export type MailOutboxStatus = "pending" | "sent" | "failed";

export interface MailOutboxView {
  id: number;
  notificationId?: number;
  recipient: string;
  subject: string;
  templateKey: string;
  status: MailOutboxStatus;
  sourceType?: string;
  sourceId?: string;
  messageId?: string;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendTrackedMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: SendMailOptions["attachments"];
  templateKey?: string;
  notificationId?: number;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendTrackedMailResult {
  success: boolean;
  outbox: MailOutboxView;
  accepted: string[];
  rejected: string[];
  messageId?: string;
  errorMessage?: string;
}

export interface MailOutboxFilters {
  status?: MailOutboxStatus;
  templateKey?: string;
  sourceType?: string;
  recipient?: string; // partial match, case-insensitive
  from?: string; // ISO date (inclusive, start of day)
  to?: string; // ISO date (inclusive, end of day)
  page?: number;
  pageSize?: number;
}

export interface MailOutboxListResult {
  data: MailOutboxView[];
  total: number;
}

// templateKeys that resolve to a standalone document-email function and
// therefore support retry. "invoice_overdue_reminder_owner" is deliberately
// excluded — it's a secondary send fired as a side effect of
// sendInvoiceReminderEmail's owner fan-out, not something with its own
// standalone re-fire path. "smtp_test" is excluded — no source document to
// regenerate content from.
export const RETRYABLE_TEMPLATE_KEYS = [
  "invoice_pdf",
  "invoice_paid",
  "invoice_overdue_reminder",
  "proforma_pdf",
  "delivery_note_pdf",
] as const;

export type RetryableTemplateKey = (typeof RETRYABLE_TEMPLATE_KEYS)[number];
