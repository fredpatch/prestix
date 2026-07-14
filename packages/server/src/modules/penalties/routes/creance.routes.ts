import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent } from "../../../middleware/authorize.js";
import * as creanceController from "../controllers/creance.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", requireAgent, creanceController.list);

export default router;
