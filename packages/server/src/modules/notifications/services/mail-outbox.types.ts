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
