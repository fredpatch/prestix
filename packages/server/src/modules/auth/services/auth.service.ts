import bcrypt from "bcryptjs";
import { db } from "../../../db/index.js";
import { users, auditLog } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { signAccessToken, verifyRefreshToken } from "../../../utils/jwt.js";
import { verifyOTP, isOTPExpired, generateOTP, hashOTP, otpExpiresAt } from "../../../utils/otp.js";
import { sendAccountActivatedEmail, sendOTPEmail } from "../../../utils/mailer.js";
import { getIntValue } from "../../settings/services/settings.service.js";
import {
  handleFailedLogin,
  resetFailedAttempts,
  buildTokens,
  buildUserPublic,
} from "./auth.helpers.js";
import type { AuthTokens, UserPublic, LoginResult } from "./auth.types.js";

export type { AuthTokens, UserPublic, LoginResult } from "./auth.types.js";

const SALT_ROUNDS = 10;

// Imported across many modules for audit trail — do not relocate without a full import sweep.
export async function logAudit(params: {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditLog).values({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata,
  });
}

export async function login(params: {
  email: string;
  otp?: string;
  password?: string;
}): Promise<LoginResult> {
  const { email, otp, password } = params;

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || !user.active) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    throw new Error("ACCOUNT_LOCKED");
  }

  // First login: OTP required, admin created the account
  if (user.firstLogin) {
    if (!otp) throw new Error("OTP_REQUIRED");
    if (!user.otpHash || !user.otpExpiresAt) throw new Error("OTP_NOT_GENERATED");
    if (isOTPExpired(user.otpExpiresAt)) throw new Error("OTP_EXPIRED");

    const valid = await verifyOTP(otp, user.otpHash);
    if (!valid) {
      await handleFailedLogin(user.id, user.failedAttempts ?? 0);
      throw new Error("OTP_INVALID");
    }

    await resetFailedAttempts(user.id);
    await logAudit({
      userId: user.id,
      action: "OTP_VALIDATED",
      entityType: "users",
      entityId: String(user.id),
    });

    const tempAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: "pending_first_login",
    });

    return {
      firstLogin: true,
      tokens: { accessToken: tempAccessToken, refreshToken: "" },
      message: "OTP validated. Please set your password.",
    };
  }

  // Normal login
  if (!password) throw new Error("PASSWORD_REQUIRED");
  if (!user.passwordHash) throw new Error("PASSWORD_NOT_SET");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await handleFailedLogin(user.id, user.failedAttempts ?? 0);
    throw new Error("PASSWORD_INVALID");
  }

  await resetFailedAttempts(user.id);
  await logAudit({
    userId: user.id,
    action: "LOGIN",
    entityType: "users",
    entityId: String(user.id),
  });

  return {
    firstLogin: false,
    tokens: buildTokens(user),
    user: buildUserPublic(user),
    message: "Login successful.",
  };
}

export async function setPassword(params: {
  userId: number;
  password: string;
  confirmation: string;
}): Promise<{ tokens: AuthTokens; user: UserPublic }> {
  const { userId, password, confirmation } = params;

  if (password !== confirmation) throw new Error("PASSWORDS_MISMATCH");
  if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .update(users)
    .set({ passwordHash, firstLogin: false, otpHash: null, otpExpiresAt: null })
    .where(eq(users.id, userId))
    .returning();

  await logAudit({
    userId: user.id,
    action: "PASSWORD_SET",
    entityType: "users",
    entityId: String(user.id),
  });

  try {
    await sendAccountActivatedEmail({
      to: user.email,
      fullName: user.fullName,
      dateTime: new Date().toLocaleString("fr-FR"),
    });
  } catch (error) {
    console.error("[email] Failed to send activation confirmation:", error);
  }

  return { tokens: buildTokens(user), user: buildUserPublic(user) };
}

export async function refreshAccessToken(token: string): Promise<{ accessToken: string }> {
  const payload = verifyRefreshToken(token);

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
  if (!user || !user.active) throw new Error("ACCOUNT_INACTIVE");

  return { accessToken: signAccessToken({ userId: user.id, email: user.email, role: user.role }) };
}

export async function generateAndSendOTP(userId: number): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error("USER_NOT_FOUND");

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresMinutes = await getIntValue("otp_expiration_minutes", 15);
  const expiresAt = otpExpiresAt(expiresMinutes);

  await db.update(users).set({ otpHash, otpExpiresAt: expiresAt }).where(eq(users.id, userId));

  await sendOTPEmail({ to: user.email, fullName: user.fullName, otp });

  await logAudit({
    userId: user.id,
    action: "OTP_GENERATED",
    entityType: "users",
    entityId: String(user.id),
  });
}
