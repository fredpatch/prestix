import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAdmin, requireSuperAdmin } from "../../../middleware/authorize.js";
import * as settingsController from "../controllers/settings.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requireAdmin, settingsController.list);
router.get("/:key", requireAdmin, settingsController.getByKey);
router.patch("/:key", requireSuperAdmin, settingsController.update);

export default router;
