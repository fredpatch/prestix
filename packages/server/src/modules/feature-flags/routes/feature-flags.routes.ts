import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireSuperAdmin } from "../../../middleware/authorize.js";
import * as featureFlagsController from "../controllers/feature-flags.controller.js";

const router = Router();

router.use(authenticate);

// Any authenticated user reads (sidebar needs this to render module visibility)
router.get("/", requireAgent, featureFlagsController.list);

// Only super_admin toggles (M2: server-side settings gate)
router.patch("/:moduleCode", requireSuperAdmin, featureFlagsController.toggle);

export default router;
