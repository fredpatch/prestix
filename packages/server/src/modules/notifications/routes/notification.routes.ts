import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAdmin, requireAgent } from "../../../middleware/authorize.js";
import * as notificationController from "../controllers/notification.controller.js";

const router = Router();

router.use(authenticate, requireAgent);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.get("/mail/status", requireAdmin, notificationController.mailStatus);
router.get("/mail/outbox", requireAdmin, notificationController.mailOutbox);
router.get("/mail/outbox/template-keys", requireAdmin, notificationController.mailOutboxTemplateKeys);
router.get("/mail/outbox/:id", requireAdmin, notificationController.mailOutboxDetail);
router.post("/mail/outbox/:id/retry", requireAdmin, notificationController.mailOutboxRetry);
router.post("/mail/test", requireAdmin, notificationController.sendTestMail);
router.get("/preferences", requireAdmin, notificationController.preferencesList);
router.patch("/preferences/:eventCode", requireAdmin, notificationController.preferencesUpdate);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.dismiss);

export default router;
