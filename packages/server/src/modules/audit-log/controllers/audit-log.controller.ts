import { Request, Response } from "express";
import * as auditLogService from "../services/audit-log.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { userId, action, entityType, entityId, from, to, page, pageSize } = req.query;
    const result = await auditLogService.listAuditLog({
      userId: userId ? parseInt(userId as string) : undefined,
      action: action as string | undefined,
      entityType: entityType as string | undefined,
      entityId: entityId as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error("[audit-log]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function listActions(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await auditLogService.listDistinctActions());
  } catch (error) {
    console.error("[audit-log]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function listEntityTypes(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await auditLogService.listDistinctEntityTypes());
  } catch (error) {
    console.error("[audit-log]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}
