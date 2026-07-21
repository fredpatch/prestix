import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAdmin } from "../../../middleware/authorize.js";
import * as auditLogController from "../controllers/audit-log.controller.js";

const router = Router();

// Admin+ only — unlike reporting's agent+ read, the full unfiltered audit
// trail (every action, every actor) is more sensitive than the dashboard's
// transaction-only activity feed.
router.use(authenticate, requireAdmin);

router.get("/", auditLogController.list);
router.get("/actions", auditLogController.listActions);
router.get("/entity-types", auditLogController.listEntityTypes);

export default router;
