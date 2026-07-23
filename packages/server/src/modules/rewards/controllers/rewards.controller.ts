import { Request, Response } from "express";
import * as rewardsService from "../services/rewards.service.js";

export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const range = rewardsService.parseRewardDateRange(req.query);
    res.json(await rewardsService.getRewardSummary(range));
  } catch (error) {
    console.error("[rewards]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function getClients(req: Request, res: Response): Promise<void> {
  try {
    const range = rewardsService.parseRewardDateRange(req.query);
    res.json(await rewardsService.getRewardClients(range));
  } catch (error) {
    console.error("[rewards]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function getReferrers(req: Request, res: Response): Promise<void> {
  try {
    const range = rewardsService.parseRewardDateRange(req.query);
    res.json(await rewardsService.getRewardReferrers(range));
  } catch (error) {
    console.error("[rewards]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}

export async function getEmployees(req: Request, res: Response): Promise<void> {
  try {
    const range = rewardsService.parseRewardDateRange(req.query);
    res.json(await rewardsService.getRewardEmployees(range));
  } catch (error) {
    console.error("[rewards]", error);
    res.status(500).json({ message: "Erreur interne." });
  }
}
