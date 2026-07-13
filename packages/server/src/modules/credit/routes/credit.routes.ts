import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireManager } from "../../../middleware/authorize.js";
import * as creditController from "../controllers/credit.controller.js";

const router = Router();

router.use(authenticate);

// agent(1)+ read — needed to show a party's credit balance during document/payment entry
router.get("/party/:partyId/balance", requireAgent, creditController.getBalance);
router.get("/party/:partyId/lots", requireAgent, creditController.listLots);
router.get("/lots/:lotId/entries", requireAgent, creditController.listEntries);

// manager(2)+ — refund is a privileged money action, same bar as discounts/withdrawals
router.post("/lots/:lotId/refund", requireManager, creditController.refund);

export default router;
