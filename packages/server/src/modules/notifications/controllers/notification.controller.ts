import { Request, Response } from "express";
import * as notificationService from "../services/notification.service.js";
import type { NotificationCategory, NotificationSeverity } from "../services/notification.types.js";
import { getMailConfigStatus, verifyMailTransport } from "../../../utils/mailer.js";
import {
  getMailOutboxById,
  listDistinctTemplateKeys,
  listMailOutbox,
  retryMailOutboxItem,
  sendTrackedMail,
} from "../services/mail-outbox.service.js";
import type { MailOutboxStatus } from "../services/mail-outbox.types.js";
import {
  listNotificationPreferences,
  updateNotificationPreference,
} from "../services/notification-preferences.service.js";

function requireUserId(req: Request): number {
  if (!req.user?.userId) throw new Error("AUTH_REQUIRED");
  return req.user.userId;
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { status, category, severity, search, page, pageSize } = req.query;
    const result = await notificationService.listNotifications(requireUserId(req), {
      status: status as "all" | "unread" | "read" | "archived" | undefined,
      category: category as NotificationCategory | undefined,
      severity: severity as NotificationSeverity | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error("[notifications]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  try {
    res.json({ count: await notificationService.getUnreadCount(requireUserId(req)) });
  } catch (error) {
    console.error("[notifications]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function markRead(req: Request, res: Response): Promise<void> {
  try {
    const notification = await notificationService.markAsRead(parseInt(req.params.id), requireUserId(req));
    res.json(notification);
  } catch (error) {
    if (error instanceof Error && error.message === "NOTIFICATION_NOT_FOUND") {
      res.status(404).json({ message: "Notification introuvable." });
      return;
    }
    console.error("[notifications]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  try {
    res.json({ updated: await notificationService.markAllAsRead(requireUserId(req)) });
  } catch (error) {
    console.error("[notifications]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function dismiss(req: Request, res: Response): Promise<void> {
  try {
    const notification = await notificationService.dismissNotification(
      parseInt(req.params.id),
      requireUserId(req),
    );
    res.json(notification);
  } catch (error) {
    if (error instanceof Error && error.message === "NOTIFICATION_NOT_FOUND") {
      res.status(404).json({ message: "Notification introuvable." });
      return;
    }
    console.error("[notifications]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function mailStatus(_req: Request, res: Response): Promise<void> {
  try {
    const status = getMailConfigStatus();
    let transportOk = false;
    if (status.configured) {
      await verifyMailTransport();
      transportOk = true;
    }
    res.json({ ...status, transportOk });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MAIL_STATUS_FAILED";
    res.status(400).json({ ...getMailConfigStatus(), transportOk: false, message });
  }
}

export async function sendTestMail(req: Request, res: Response): Promise<void> {
  try {
    const to = typeof req.body?.to === "string" ? req.body.to.trim() : "";
    if (!to) {
      res.status(400).json({ message: "EMAIL_REQUIRED" });
      return;
    }

    const result = await sendTrackedMail({
      to,
      subject: "PrestiX - Test SMTP",
      text:
        "Bonjour,\n\nCeci est un email de test envoye par PrestiX pour verifier la configuration SMTP.\n\nSi vous recevez ce message, la connexion SMTP fonctionne.",
      html:
        "<p>Bonjour,</p><p>Ceci est un email de test envoye par PrestiX pour verifier la configuration SMTP.</p><p>Si vous recevez ce message, la connexion SMTP fonctionne.</p>",
      templateKey: "smtp_test",
      sourceType: "mail_test",
      sourceId: String(req.user!.userId),
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "MAIL_TEST_FAILED";
    console.error("[notifications:mail-test]", error);
    res.status(400).json({ message });
  }
}

export async function mailOutbox(req: Request, res: Response): Promise<void> {
  try {
    const { status, templateKey, sourceType, recipient, from, to, page, pageSize } = req.query;
    const result = await listMailOutbox({
      status: status as MailOutboxStatus | undefined,
      templateKey: templateKey as string | undefined,
      sourceType: sourceType as string | undefined,
      recipient: recipient as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error("[notifications:mail-outbox]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function mailOutboxDetail(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const row = await getMailOutboxById(id);
    if (!row) {
      res.status(404).json({ message: "MAIL_OUTBOX_ITEM_NOT_FOUND" });
      return;
    }
    res.json(row);
  } catch (error) {
    console.error("[notifications:mail-outbox-detail]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function mailOutboxTemplateKeys(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await listDistinctTemplateKeys());
  } catch (error) {
    console.error("[notifications:mail-outbox-template-keys]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function mailOutboxRetry(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const result = await retryMailOutboxItem(id, requireUserId(req));
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "MAIL_OUTBOX_RETRY_FAILED";
    const knownErrors = [
      "MAIL_OUTBOX_ITEM_NOT_FOUND",
      "MAIL_OUTBOX_ITEM_NOT_FAILED",
      "MAIL_OUTBOX_ITEM_NOT_RETRYABLE",
      "RECIPIENT_EMAIL_REQUIRED",
    ];
    if (knownErrors.includes(message)) {
      const status = message === "MAIL_OUTBOX_ITEM_NOT_FOUND" ? 404 : 400;
      res.status(status).json({ message });
      return;
    }
    console.error("[notifications:mail-outbox-retry]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function preferencesList(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await listNotificationPreferences());
  } catch (error) {
    console.error("[notifications:preferences-list]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function preferencesUpdate(req: Request, res: Response): Promise<void> {
  try {
    const { eventCode } = req.params;
    const { inAppEnabled, emailEnabled } = req.body;
    const result = await updateNotificationPreference(eventCode, { inAppEnabled, emailEnabled });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PREFERENCE_UPDATE_FAILED";
    if (message === "NOTIFICATION_PREFERENCE_NOT_FOUND") {
      res.status(404).json({ message });
      return;
    }
    console.error("[notifications:preferences-update]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}
