import { Request, Response } from "express";
import * as catalogService from "../services/commission-catalog.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    TYPE_NOT_FOUND: 404,
    CODE_ALREADY_EXISTS: 409,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[commission-catalog]", error);
  res.status(code).json({ message, code: message });
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const includeInactive = req.query.includeInactive !== "false";
    res.json(await catalogService.listCommissionTypes(includeInactive));
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { code, label, icon, fieldSchema } = req.body;
    if (!code || !label) {
      res.status(400).json({ message: "Required fields: code, label." });
      return;
    }
    const type = await catalogService.createCommissionType({
      code,
      label,
      icon,
      fieldSchema,
      createdByUserId: req.user!.userId,
    });
    res.status(201).json(type);
  } catch (error) {
    handleError(res, error);
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { label, icon, fieldSchema } = req.body;
    const type = await catalogService.updateCommissionType(req.params.code, {
      label,
      icon,
      fieldSchema,
      updatedByUserId: req.user!.userId,
    });
    res.json(type);
  } catch (error) {
    handleError(res, error);
  }
}

export async function toggleActive(req: Request, res: Response): Promise<void> {
  try {
    const { active } = req.body;
    if (typeof active !== "boolean") {
      res.status(400).json({ message: "Field 'active' must be a boolean." });
      return;
    }
    const type = await catalogService.toggleCommissionTypeActive(
      req.params.code,
      active,
      req.user!.userId,
    );
    res.json(type);
  } catch (error) {
    handleError(res, error);
  }
}
