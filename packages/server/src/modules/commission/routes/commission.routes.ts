import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireAdmin } from "../../../middleware/authorize.js";
import * as commissionController from "../controllers/commission.controller.js";
import * as commissionEditController from "../controllers/commission-edit.controller.js";

const router = Router();

router.use(authenticate);

// agent+ — any staff member can log a commission the moment they close one.
router.get("/", requireAgent, commissionController.list);
router.post("/", requireAgent, commissionController.create);

// admin+ — soft-delete only, see controller comment for why the higher bar.
router.delete("/:id", requireAdmin, commissionController.softDelete);

// Correction workflow — agent+ proposes, admin+ reviews. See
// commission-edit.service.ts for why this exists instead of a direct edit.
router.post("/:id/edit-requests", requireAgent, commissionEditController.create);
router.get("/edit-requests", requireAdmin, commissionEditController.list);
router.post("/edit-requests/:requestId/approve", requireAdmin, commissionEditController.approve);
router.post("/edit-requests/:requestId/reject", requireAdmin, commissionEditController.reject);

export default router;
