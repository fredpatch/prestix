// JWT verification middleware — Sprint 1.
import { verifyAccessToken } from "@/utils/jwt.js";
import { Request, NextFunction, Response } from "express";

// ── Noms des cookies ──────────────────────────────────────────────────────
export const ACCESS_TOKEN_COOKIE = "prestix_access";
export const REFRESH_TOKEN_COOKIE = "prestix_refresh";

// ── Options des cookies ───────────────────────────────────────────────────
export const accessCookieOptions = {
  httpOnly: true, // Inaccessible au JS
  secure: process.env.NODE_ENV === "production", // HTTPS uniquement en prod
  sameSite: "strict" as const, // Protection CSRF
  maxAge: 15 * 60 * 1000, // 15 minutes en ms
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en ms
};

// ── Middleware d'authentification ─────────────────────────────────────────
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    res.status(401).json({ message: "Non authentifié." });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    // Token expiré — le client devra appeler /api/auth/refresh
    res.status(401).json({ message: "Session expirée.", code: "TOKEN_EXPIRED" });
  }
}

// ── Utilitaire pour effacer les cookies à la déconnexion ─────────────────
export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE);
  res.clearCookie(REFRESH_TOKEN_COOKIE);
}
