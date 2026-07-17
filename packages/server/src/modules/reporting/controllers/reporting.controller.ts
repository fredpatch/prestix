import { Request, Response } from "express";
import * as reportingService from "../services/reporting.service.js";
import { generateReportingExcel } from "../services/reporting-export.service.js";
import { generateDashboardReportPdf } from "../services/reporting-pdf.service.js";
import type { DateRangeParams } from "../services/reporting.types.js";

function parseDateRange(req: Request): DateRangeParams {
  const from = (req.query.from as string) ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const to = (req.query.to as string) ?? new Date().toISOString().split("T")[0];
  const basis = (req.query.basis as string) === "cash" ? "cash" : "accrual";
  return { from, to, basis };
}

// agent+ read everywhere in this module — dashboard/reporting is informational,
// no privileged mutation happens here at all.
export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const params = parseDateRange(req);
    const summary = await reportingService.getDashboardSummary(params);
    res.json(summary);
  } catch (error) {
    console.error("[reporting]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function getCaComposition(req: Request, res: Response): Promise<void> {
  try {
    const params = parseDateRange(req);
    const result = await reportingService.getCaComposition(params);
    res.json(result);
  } catch (error) {
    console.error("[reporting]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function getClientKpis(req: Request, res: Response): Promise<void> {
  try {
    const params = parseDateRange(req);
    res.json(await reportingService.getClientKpis(params));
  } catch (error) {
    console.error("[reporting]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function getApporteurKpis(req: Request, res: Response): Promise<void> {
  try {
    const params = parseDateRange(req);
    res.json(await reportingService.getApporteurKpis(params));
  } catch (error) {
    console.error("[reporting]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function getEmployeKpis(req: Request, res: Response): Promise<void> {
  try {
    const params = parseDateRange(req);
    res.json(await reportingService.getEmployeKpis(params));
  } catch (error) {
    console.error("[reporting]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function getEmployeeActivityDetail(req: Request, res: Response): Promise<void> {
  try {
    const agentId = parseInt(req.params.agentId);
    const params = parseDateRange(req);
    res.json(await reportingService.getEmployeeActivityDetail(agentId, params));
  } catch (error) {
    console.error("[reporting]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function exportExcel(req: Request, res: Response): Promise<void> {
  try {
    const params = parseDateRange(req);
    const buffer = await generateReportingExcel(params);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="rapport-${params.from}-${params.to}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("[reporting-export]", error);
    res.status(500).json({ message: "Erreur lors de l'export." });
  }
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const transactionOnly = req.query.transactionOnly !== "false"; // default true
    const rows = await reportingService.getRecentActivity(limit, transactionOnly);
    res.json(rows);
  } catch (error) {
    console.error("[reporting]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function exportPdf(req: Request, res: Response): Promise<void> {
  try {
    const params = parseDateRange(req);
    const pdf = await generateDashboardReportPdf(params);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="rapport-${params.from}-${params.to}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error("[reporting-pdf]", error);
    res.status(500).json({ message: "Erreur lors de la génération du PDF." });
  }
}
