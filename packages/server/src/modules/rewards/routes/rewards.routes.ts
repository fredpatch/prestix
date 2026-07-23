import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent } from "../../../middleware/authorize.js";
import * as rewardsController from "../controllers/rewards.controller.js";

const router = Router();

router.use(authenticate);

// Informational preview only: no payout, no credit lot, no payable ledger.
router.get("/summary", requireAgent, rewardsController.getSummary);
router.get("/clients", requireAgent, rewardsController.getClients);
router.get("/referrers", requireAgent, rewardsController.getReferrers);
router.get("/employees", requireAgent, rewardsController.getEmployees);

export default router;
