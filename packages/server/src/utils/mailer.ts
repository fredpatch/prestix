import nodemailer from "nodemailer";
import { getBoolValue } from "@/modules/settings/services/settings.service.js";

export interface MailResult {
  messageId?: string;
  accepted: string[];
  rejected: string[];
}

function isMailEnabled(): boolean {
  return process.env.MAIL_ENABLED !== "false";
}

function smtpPort(): number {
  return Number(process.env.SMTP_PORT ?? 587);
}

function smtpSecure(): boolean {
  if (process.env.SMTP_SECURE !== undefined) return process.env.SMTP_SECURE === "true";
  return smtpPort() === 465;
}

function smtpPassword(): string | undefined {
  return process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD;
}

function mailFrom(): string | undefined {
  return process.env.MAIL_FROM ?? process.env.SMTP_FROM;
}

function assertMailConfigured(): void {
  if (!isMailEnabled()) throw new Error("MAIL_DISABLED");
  if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST_REQUIRED");
  if (!process.env.SMTP_USER) throw new Error("SMTP_USER_REQUIRED");
  if (!smtpPassword()) throw new Error("SMTP_PASS_REQUIRED");
  if (!mailFrom()) throw new Error("MAIL_FROM_REQUIRED");
}

function createTransporter() {
  assertMailConfigured();
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    secure: smtpSecure(),
    auth: { user: process.env.SMTP_USER, pass: smtpPassword() },
  });
}

export function getMailConfigStatus(): {
  enabled: boolean;
  configured: boolean;
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  from?: string;
} {
  const enabled = isMailEnabled();
  return {
    enabled,
    configured:
      enabled &&
      Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && smtpPassword() && mailFrom()),
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    secure: smtpSecure(),
    user: process.env.SMTP_USER,
    from: mailFrom(),
  };
}

export async function verifyMailTransport(): Promise<void> {
  const transporter = createTransporter();
  await transporter.verify();
}

export async function sendMail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<MailResult> {
  const runtimeEnabled = await getBoolValue("mail_enabled", true);
  if (!runtimeEnabled) throw new Error("MAIL_DISABLED_BY_SETTINGS");

  const transporter = createTransporter();
  const result = (await transporter.sendMail({
    from: mailFrom(),
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    replyTo: params.replyTo,
  })) as {
    messageId?: string;
    accepted?: unknown[];
    rejected?: unknown[];
  };

  return {
    messageId: result.messageId,
    accepted: (result.accepted ?? []).map(String),
    rejected: (result.rejected ?? []).map(String),
  };
}

export async function sendTestEmail(to: string): Promise<MailResult> {
  return sendMail({
    to,
    subject: "PrestiX - Test SMTP",
    text:
      "Bonjour,\n\nCeci est un email de test envoye par PrestiX pour verifier la configuration SMTP.\n\nSi vous recevez ce message, la connexion SMTP fonctionne.",
    html:
      "<p>Bonjour,</p><p>Ceci est un email de test envoye par PrestiX pour verifier la configuration SMTP.</p><p>Si vous recevez ce message, la connexion SMTP fonctionne.</p>",
  });
}

export async function sendOTPEmail(params: {
  to: string;
  fullName: string;
  otp: string;
}): Promise<void> {
  await sendMail({
    to: params.to,
    subject: "PrestiX - Code d'activation",
    text: `Bonjour ${params.fullName},\n\nVotre code d'activation : ${params.otp}\n\nCe code expire dans quelques minutes.`,
  });
}

export async function sendAccountActivatedEmail(params: {
  to: string;
  fullName: string;
  dateTime: string;
}): Promise<void> {
  await sendMail({
    to: params.to,
    subject: "PrestiX - Compte active",
    text: `Bonjour ${params.fullName},\n\nVotre mot de passe a ete defini avec succes le ${params.dateTime}.`,
  });
}
