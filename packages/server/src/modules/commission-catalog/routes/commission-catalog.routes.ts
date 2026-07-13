import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireSuperAdmin } from "../../../middleware/authorize.js";
import * as catalogController from "../controllers/commission-catalog.controller.js";

const router = Router();

router.use(authenticate);

// Any authenticated user reads (M10 commission-entry form needs the active list)
router.get("/", requireAgent, catalogController.list);

// super_admin-extensible per M2 spec — create/update/toggle all gated here
router.post("/", requireSuperAdmin, catalogController.create);
router.patch("/:code", requireSuperAdmin, catalogController.update);
router.patch("/:code/active", requireSuperAdmin, catalogController.toggleActive);

export default router;
