import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireManager } from "../../../middleware/authorize.js";
import * as partyController from "../controllers/party.controller.js";

const router = Router();

router.use(authenticate);

// agent(1)+ — quick-add during commission/document entry needs this available to any agent
router.get("/", requireAgent, partyController.list);
router.get("/stats", requireAgent, partyController.stats);
router.get("/:id", requireAgent, partyController.getById);
router.post("/", requireAgent, partyController.create);
router.patch("/:id", requireAgent, partyController.update);

// manager(2)+ — deactivation is a privileged action, matches the pattern used for
// discounts/withdrawals/reschedule elsewhere in the M1 role matrix
router.patch("/:id/activation", requireManager, partyController.toggleActivation);

export default router;
