import { db } from "../../../db/index.js";
import { users } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { signAccessToken, signRefreshToken, TokenPayload } from "../../../utils/jwt.js";
import { getIntValue } from "../../settings/services/settings.service.js";
import type { AuthTokens, UserPublic } from "./auth.types.js";

export async function handleFailedLogin(userId: number, currentAttempts: number): Promise<void> {
  const attempts = currentAttempts + 1;
  const updates: Record<string, unknown> = { failedAttempts: attempts };

  const maxAttempts = await getIntValue("lockout_max_attempts", 5);
  if (attempts >= maxAttempts) {
    const lockoutMinutes = await getIntValue("lockout_duration_minutes", 30);
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + lockoutMinutes);
    updates.lockedUntil = lockedUntil;
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
}

export async function resetFailedAttempts(userId: number): Promise<void> {
  await db
    .update(users)
    .set({ failedAttempts: 0, lockedUntil: null })
    .where(eq(users.id, userId));
}

export function buildTokens(user: { id: number; email: string; role: string }): AuthTokens {
  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export function buildUserPublic(user: {
  id: number;
  email: string;
  fullName: string;
  role: string;
}): UserPublic {
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}