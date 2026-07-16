import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireAdmin, requireSuperAdmin } from "../../../middleware/authorize.js";
import * as savingsController from "../controllers/savings.controller.js";

const router = Router();

router.use(authenticate);

router.post("/subscribe", requireAgent, savingsController.subscribe);
router.get("/party/:partyId", requireAgent, savingsController.getAccountByParty);
router.get("/:accountId/transactions", requireAgent, savingsController.listTransactions);
router.post("/:accountId/deposits", requireAgent, savingsController.deposit);

// admin+ — deliberately raised above the spec's original manager+ (confirmed
// with Fred): standalone cash withdrawal is NOT a normal, routine action.
// Money only ever leaves an épargne account by being spent — a ticket or shop
// purchase via épargne-as-payment (M5 integration). This exists purely as an
// admin-level exceptional override for special cases, not a peer action to
// deposit.
router.post("/:accountId/withdrawals", requireAdmin, savingsController.withdraw);

// admin+ — the one correction mechanism, same bar as invoice cancellation.
router.post("/transactions/:transactionId/reverse", requireAdmin, savingsController.reverse);
router.get("/transactions/:transactionId/receipt", requireAgent, savingsController.downloadReceipt);

// super_admin — manual cron trigger, same pattern as Sprint 5's penalty accrual.
router.post("/convert-expired-credit", requireSuperAdmin, savingsController.triggerConversion);

export default router;
