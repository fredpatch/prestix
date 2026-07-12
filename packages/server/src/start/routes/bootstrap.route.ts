import { Router } from "express";
import * as bootstrapController from "../controllers/bootstrap.controller.js";

const router = Router();

// ── Routes publiques — aucune authentification requise ────────────────────
// Ces routes sont accessibles sans token car le système n'est pas encore
// initialisé — aucun utilisateur n'existe pour s'authentifier
router.get("/status", bootstrapController.status);
router.post("/init", bootstrapController.init);

export default router;
