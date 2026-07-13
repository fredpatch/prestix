import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent } from "../../../middleware/authorize.js";
import * as deliveryNoteController from "../controllers/delivery-note.controller.js";

const router = Router();

router.use(authenticate);

router.post("/invoice/:invoiceId", requireAgent, deliveryNoteController.create);
router.get("/invoice/:invoiceId", requireAgent, deliveryNoteController.getByInvoice);

export default router;
