import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireAdmin } from "../../../middleware/authorize.js";
import * as commissionController from "../controllers/commission.controller.js";

const router = Router();

router.use(authenticate);

// agent+ — any staff member can log a commission the moment they close one.
router.get("/", requireAgent, commissionController.list);
router.post("/", requireAgent, commissionController.create);

// admin+ — soft-delete only, see controller comment for why the higher bar.
router.delete("/:id", requireAdmin, commissionController.softDelete);

export default router;
