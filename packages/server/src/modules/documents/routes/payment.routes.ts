import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireAdmin } from "../../../middleware/authorize.js";
import * as paymentController from "../controllers/payment.controller.js";

const router = Router();

router.use(authenticate);

router.get("/invoice/:invoiceId", requireAgent, paymentController.listByInvoice);
router.get("/invoice/:invoiceId/installments", requireAgent, paymentController.listInstallments);
router.post("/invoice/:invoiceId", requireAgent, paymentController.record);

// M5: reschedule is privileged admin+, forward-only, reason required
router.patch("/installments/:installmentId/reschedule", requireAdmin, paymentController.reschedule);

export default router;
