import { Request, Response } from "express";
import * as featureFlagsService from "../services/feature-flags.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  try {
    res.json(await featureFlagsService.listFeatureFlags());
  } catch (error) {
    console.error("[feature-flags/list]", error);
    res.status(500).json({ message: "Internal error." });
  }
}

export async function toggle(req: Request, res: Response): Promise<void> {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      res.status(400).json({ message: "Field 'enabled' must be a boolean." });
      return;
    }
    const flag = await featureFlagsService.toggleFeatureFlag(
      req.params.moduleCode,
      enabled,
      req.user!.userId,
    );
    res.json(flag);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "FLAG_NOT_FOUND") {
      res.status(404).json({ message: "Feature flag not found." });
      return;
    }
    console.error("[feature-flags/toggle]", error);
    res.status(500).json({ message: "Internal error." });
  }
}
