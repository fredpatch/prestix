import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { handleAuthError } from "../../../utils/error.js";
import {
  accessCookieOptions,
  refreshCookieOptions,
  clearAuthCookies,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../../../middleware/authenticate.js";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema.js";
import { eq } from "drizzle-orm";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, otp, password } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email required." });
    return;
  }

  try {
    const result = await authService.login({ email, otp, password });

    if (result.firstLogin && result.tokens) {
      res.cookie(ACCESS_TOKEN_COOKIE, result.tokens.accessToken, {
        ...accessCookieOptions,
        maxAge: 5 * 60 * 1000,
      });
      res.json({ firstLogin: true, message: result.message });
      return;
    }

    if (result.tokens) {
      res.cookie(ACCESS_TOKEN_COOKIE, result.tokens.accessToken, accessCookieOptions);
      res.cookie(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, refreshCookieOptions);
    }

    res.json({ firstLogin: false, user: result.user });
  } catch (error) {
    handleAuthError(res, error);
  }
}

export async function setPassword(req: Request, res: Response): Promise<void> {
  const { password, confirmation } = req.body;

  if (!password || !confirmation) {
    res.status(400).json({ message: "Password and confirmation required." });
    return;
  }

  try {
    const { tokens, user } = await authService.setPassword({
      userId: req.user!.userId,
      password,
      confirmation,
    });

    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessCookieOptions);
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions);

    res.json({ message: "Password set successfully.", user });
  } catch (error) {
    handleAuthError(res, error);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    res.status(401).json({ message: "Missing refresh token." });
    return;
  }

  try {
    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions);
    res.json({ message: "Token refreshed." });
  } catch (error) {
    clearAuthCookies(res);
    handleAuthError(res, error);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    await authService.logAudit({
      userId: req.user!.userId,
      action: "LOGOUT",
      entityType: "users",
      entityId: String(req.user!.userId),
    });
  } catch (error) {
    console.error("[auth/logout] audit error:", error);
  } finally {
    clearAuthCookies(res);
    res.json({ message: "Logged out." });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
  } catch (error) {
    console.error("[auth/me]", error);
    res.status(500).json({ message: "Internal error." });
  }
}