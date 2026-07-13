import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent } from "../../../middleware/authorize.js";
import * as partyHistoryController from "../controllers/party-history.controller.js";

const router = Router();

router.use(authenticate);
router.get("/:id/history", requireAgent, partyHistoryController.get);

export default router;
