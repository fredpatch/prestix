import { Response } from "express";

const AUTH_ERROR_STATUS: Record<string, number> = {
  ACCOUNT_NOT_FOUND: 401,
  ACCOUNT_LOCKED: 423,
  OTP_REQUIRED: 400,
  OTP_NOT_GENERATED: 400,
  OTP_EXPIRED: 400,
  OTP_INVALID: 401,
  PASSWORD_REQUIRED: 400,
  PASSWORD_NOT_SET: 400,
  PASSWORD_INVALID: 401,
  PASSWORDS_MISMATCH: 400,
  PASSWORD_TOO_SHORT: 400,
  ACCOUNT_INACTIVE: 401,
};

export function handleAuthError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status = AUTH_ERROR_STATUS[message] ?? 500;
  if (status === 500) console.error("[auth]", error);
  res.status(status).json({ message, code: message });
}
