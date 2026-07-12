import { Request, Response } from "express";
import * as bootstrapService from "../services/bootstrap.service.js";

export async function status(_req: Request, res: Response): Promise<void> {
  try {
    const initialized = await bootstrapService.isInitialized();
    res.json({ initialized });
  } catch (error) {
    console.error("[bootstrap/status]", error);
    res.status(500).json({ message: "Internal error." });
  }
}

export async function init(req: Request, res: Response): Promise<void> {
  try {
    const alreadyInitialized = await bootstrapService.isInitialized();
    if (alreadyInitialized) {
      res.status(403).json({
        message: "System is already initialized.",
        code: "SYSTEM_ALREADY_INITIALIZED",
      });
      return;
    }

    const { fullName, email, password, confirmation } = req.body;

    if (!fullName || !email || !password || !confirmation) {
      res.status(400).json({
        message: "All fields are required: fullName, email, password, confirmation.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email." });
      return;
    }

    if (password !== confirmation) {
      res.status(400).json({ message: "Passwords do not match." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters." });
      return;
    }

    await bootstrapService.initializeSuperAdmin({ fullName, email, password });

    res.status(201).json({
      message: "Super Admin created successfully. You can now log in.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "SYSTEM_ALREADY_INITIALIZED") {
      res.status(403).json({ message: "System is already initialized.", code: message });
      return;
    }
    if (message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({ message: "This email is already in use.", code: message });
      return;
    }

    console.error("[bootstrap/init]", error);
    res.status(500).json({ message: "Internal error." });
  }
}
