import { Request, Response } from "express";
import * as stockService from "../services/stock.service.js";

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    STOCK_ARTICLE_NOT_FOUND: 404,
    MOVEMENT_ALREADY_RECORDED: 409,
    INSUFFICIENT_STOCK: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[stock]", error);
  res.status(code).json({ message, code: message });
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const includeInactive = req.query.includeInactive === "true";
    res.json(await stockService.listStockArticles(includeInactive));
  } catch (error) {
    handleError(res, error);
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    res.json(await stockService.getStockArticleById(parseInt(req.params.id)));
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, unit, defaultSellingPrice, defaultSupplierPrice, minLevel } = req.body;
    if (!name || typeof defaultSellingPrice !== "number") {
      res.status(400).json({ message: "name et defaultSellingPrice sont requis." });
      return;
    }
    const article = await stockService.createStockArticle(
      { name, unit, defaultSellingPrice, defaultSupplierPrice, minLevel },
      req.user!.userId,
    );
    res.status(201).json(article);
  } catch (error) {
    handleError(res, error);
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { name, unit, defaultSellingPrice, defaultSupplierPrice, minLevel } = req.body;
    const article = await stockService.updateStockArticle(
      parseInt(req.params.id),
      { name, unit, defaultSellingPrice, defaultSupplierPrice, minLevel },
      req.user!.userId,
    );
    res.json(article);
  } catch (error) {
    handleError(res, error);
  }
}

export async function toggleActive(req: Request, res: Response): Promise<void> {
  try {
    const { active } = req.body;
    if (typeof active !== "boolean") {
      res.status(400).json({ message: "Le champ 'active' doit être un booléen." });
      return;
    }
    const article = await stockService.toggleStockArticleActive(
      parseInt(req.params.id),
      active,
      req.user!.userId,
    );
    res.json(article);
  } catch (error) {
    handleError(res, error);
  }
}

export async function restock(req: Request, res: Response): Promise<void> {
  try {
    const { type, quantity } = req.body;
    if (!["IN", "ADJUST"].includes(type) || typeof quantity !== "number") {
      res.status(400).json({ message: "type (IN|ADJUST) et quantity sont requis." });
      return;
    }
    const movement = await stockService.recordManualStockMovement(
      parseInt(req.params.id),
      type,
      quantity,
      req.user!.userId,
    );
    res.status(201).json(movement);
  } catch (error) {
    handleError(res, error);
  }
}

export async function listMovements(req: Request, res: Response): Promise<void> {
  try {
    res.json(await stockService.listMovementsForArticle(parseInt(req.params.id)));
  } catch (error) {
    handleError(res, error);
  }
}
