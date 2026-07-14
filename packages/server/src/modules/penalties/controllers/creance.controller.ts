import { Request, Response } from "express";
import { getCreances } from "../services/creance.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const onlyOverdue = req.query.overdue === "true";
    res.json(await getCreances(onlyOverdue));
  } catch (error) {
    console.error("[creances]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}
