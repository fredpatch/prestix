import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent } from "../../../middleware/authorize.js";
import * as proformaController from "../controllers/proforma.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requireAgent, proformaController.list);
router.get("/:id", requireAgent, proformaController.getById);
router.post("/", requireAgent, proformaController.create);

export default router;
