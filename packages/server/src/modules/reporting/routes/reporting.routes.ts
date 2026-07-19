import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAgent } from "../../../middleware/authorize.js";
import * as reportingController from "../controllers/reporting.controller.js";

const router = Router();

router.use(authenticate);

// Read-only, informational module — agent+ everywhere, no privileged
// mutation exists here at all (unlike every other module in this app).
router.get("/summary", requireAgent, reportingController.getSummary);
router.get("/ca-composition", requireAgent, reportingController.getCaComposition);
router.get("/ca-trend", requireAgent, reportingController.getCaTrend);
router.get("/kpis/clients", requireAgent, reportingController.getClientKpis);
router.get("/kpis/apporteurs", requireAgent, reportingController.getApporteurKpis);
router.get("/kpis/employes", requireAgent, reportingController.getEmployeKpis);
router.get("/employees/:agentId/detail", requireAgent, reportingController.getEmployeeActivityDetail);
router.get("/export/excel", requireAgent, reportingController.exportExcel);
router.get("/recent-activity", requireAgent, reportingController.getRecentActivity);
router.get("/export/pdf", requireAgent, reportingController.exportPdf);

export default router;
