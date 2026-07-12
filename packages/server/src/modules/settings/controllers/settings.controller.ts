import { Request, Response } from "express";
import * as settingsService from "../services/settings.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { module } = req.query;
    const result = await settingsService.listSettings(module as string | undefined);
    res.json(result);
  } catch (error) {
    console.error("[settings/list]", error);
    res.status(500).json({ message: "Internal error." });
  }
}

export async function getByKey(req: Request, res: Response): Promise<void> {
  try {
    const setting = await settingsService.getSetting(req.params.key);
    res.json(setting);
  } catch (error) {
    if (error instanceof Error && error.message === "SETTING_NOT_FOUND") {
      res.status(404).json({ message: "Setting not found." });
      return;
    }
    console.error("[settings/getByKey]", error);
    res.status(500).json({ message: "Internal error." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { value } = req.body;
    if (value === undefined || value === null) {
      res.status(400).json({ message: "Field required: value." });
      return;
    }
    const setting = await settingsService.updateSetting(
      req.params.key,
      String(value),
      req.user!.userId,
    );
    res.json(setting);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "SETTING_NOT_FOUND") {
      res.status(404).json({ message: "Setting not found." });
      return;
    }
    if (message.startsWith("INVALID_")) {
      res.status(400).json({ message: "Invalid value for this setting type.", code: message });
      return;
    }
    console.error("[settings/update]", error);
    res.status(500).json({ message: "Internal error." });
  }
}
