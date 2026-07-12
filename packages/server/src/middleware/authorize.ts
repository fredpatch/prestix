// authorize(level) — 4-level RBAC with upward inheritance (agent1/manager2/admin3/super_admin4).
// Sprint 1.
import { Request, Response, NextFunction } from "express";
import { roleLevel, type roleEnum } from "@/db/schema.js";

type Role = (typeof roleEnum.enumValues)[number];

// ── Middleware de vérification de rôle ────────────────────────────────────
// Usage : router.get('/users', authenticate, requireRole('admin'), handler)
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Non authentifié." });
      return;
    }

    const userRole = req.user.role as Role;
    const userLevel = roleLevel[userRole] ?? 0;

    // L'utilisateur doit avoir AU MOINS le niveau du rôle le plus bas
    // parmi ceux acceptés
    const minRequiredLevel = Math.min(...roles.map((r) => roleLevel[r] ?? 0));

    if (userLevel < minRequiredLevel) {
      res.status(403).json({ message: "Accès refusé - droits insuffisants." });
      return;
    }

    next();
  };
}

// ── Raccourcis pratiques ───────────────────────────────────────────────────
// Au lieu de requireRole('admin', 'super_admin') partout
export const requireAdmin = requireRole("admin");
export const requireSuperAdmin = requireRole("super_admin");
export const requireAgent = requireRole("agent");
