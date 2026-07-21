import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireAdmin } from "../../../middleware/authorize.js";
import * as invoiceController from "../controllers/invoice.controller.js";
import * as invoicePdfController from "../controllers/invoice-pdf.controller.js";
import * as documentEmailController from "../controllers/document-email.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requireAgent, invoiceController.list);
router.get("/:id", requireAgent, invoiceController.getById);
router.get("/:id/pdf", requireAgent, invoicePdfController.download);
router.post("/:id/email", requireAgent, documentEmailController.sendInvoice);
router.post("/:id/send-reminder", requireAgent, documentEmailController.sendInvoiceReminder);
router.post("/", requireAgent, invoiceController.createDraft);
router.post("/from-proforma/:proformaId", requireAgent, invoiceController.promoteFromProforma);
router.post("/:id/lines", requireAgent, invoiceController.addLine);
router.patch("/:id/lines/:lineId", requireAgent, invoiceController.updateLine);
router.delete("/:id/lines/:lineId", requireAgent, invoiceController.removeLine);
router.post("/:id/issue", requireAgent, invoiceController.issue);

// M4: cancellation is admin+, reason required — the one privileged action in this module
router.post("/:id/cancel", requireAdmin, invoiceController.cancel);

export default router;
