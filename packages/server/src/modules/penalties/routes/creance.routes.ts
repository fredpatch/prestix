import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireSuperAdmin } from "../../../middleware/authorize.js";
import * as creanceController from "../controllers/creance.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", requireAgent, creanceController.list);

router.post("/accrue-now", requireSuperAdmin, creanceController.accrueNow);

export default router;
