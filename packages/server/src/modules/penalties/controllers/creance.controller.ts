import { Request, Response } from "express";
import { getCreances } from "../services/creance.service.js";
import { accrueOverduePenalties } from "../services/penalty.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const onlyOverdue = req.query.overdue === "true";
    res.json(await getCreances(onlyOverdue));
  } catch (error) {
    console.error("[creances]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

// Manual trigger for the daily accrual cron — legitimate standing feature (an
// admin forcing a check after correcting a settings mistake), not just a test
// hook. super_admin-gated since it directly creates real financial records.
export async function accrueNow(req: Request, res: Response): Promise<void> {
  try {
    const inserted = await accrueOverduePenalties();
    res.json({ inserted });
  } catch (error) {
    console.error("[creances/accrue-now]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}
