import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent } from "../../../middleware/authorize.js";
import * as proformaController from "../controllers/proforma.controller.js";
import * as proformaPdfController from "../controllers/proforma-pdf.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requireAgent, proformaController.list);
router.get("/:id", requireAgent, proformaController.getById);
router.get("/:id/pdf", requireAgent, proformaPdfController.download);
router.post("/", requireAgent, proformaController.create);
router.post("/:id/lines", requireAgent, proformaController.addLine);
router.delete("/:id/lines/:lineId", requireAgent, proformaController.removeLine);

export default router;
