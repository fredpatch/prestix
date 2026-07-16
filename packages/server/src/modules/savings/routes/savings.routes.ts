import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireManager, requireAdmin, requireSuperAdmin } from "../../../middleware/authorize.js";
import * as savingsController from "../controllers/savings.controller.js";

const router = Router();

router.use(authenticate);

router.post("/subscribe", requireAgent, savingsController.subscribe);
router.get("/party/:partyId", requireAgent, savingsController.getAccountByParty);
router.get("/:accountId/transactions", requireAgent, savingsController.listTransactions);
router.post("/:accountId/deposits", requireAgent, savingsController.deposit);

// manager+ — the privileged action per spec.
router.post("/:accountId/withdrawals", requireManager, savingsController.withdraw);

// admin+ — the one correction mechanism, same bar as invoice cancellation.
router.post("/transactions/:transactionId/reverse", requireAdmin, savingsController.reverse);
router.get("/transactions/:transactionId/receipt", requireAgent, savingsController.downloadReceipt);

// super_admin — manual cron trigger, same pattern as Sprint 5's penalty accrual.
router.post("/convert-expired-credit", requireSuperAdmin, savingsController.triggerConversion);

export default router;
