import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent, requireManager } from "../../../middleware/authorize.js";
import * as stockController from "../controllers/stock.controller.js";

const router = Router();

router.use(authenticate);

// agent+ read — needed for the shop-line article dropdown
router.get("/", requireAgent, stockController.list);
router.get("/:id", requireAgent, stockController.getById);
router.get("/:id/movements", requireAgent, stockController.listMovements);

// manager+ — base-data setup and restock, matches the M9 theme throughout
router.post("/", requireManager, stockController.create);
router.patch("/:id", requireManager, stockController.update);
router.patch("/:id/active", requireManager, stockController.toggleActive);
router.post("/:id/restock", requireManager, stockController.restock);

export default router;
