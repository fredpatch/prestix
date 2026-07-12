import crypto from "crypto";
import bcrypt from "bcryptjs";

const OTP_LENGTH = 6;
const SALT_ROUNDS = 10;

// ── Génération d'un code OTP numérique à 6 chiffres ──────────────────────
export function generateOTP(): string {
  // crypto.randomInt est cryptographiquement sûr — pas Math.random()
  const otp = crypto.randomInt(0, 10 ** OTP_LENGTH);
  // Pad avec des zéros si nécessaire (ex: 000123)
  return otp.toString().padStart(OTP_LENGTH, "0");
}

// ── Hash de l'OTP pour stockage en BDD ───────────────────────────────────
// On ne stocke jamais l'OTP en clair, comme un mot de passe
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, SALT_ROUNDS);
}

// ── Vérification de l'OTP saisi par l'utilisateur ────────────────────────
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

// ── Calcul de la date d'expiration ────────────────────────────────────────
export function otpExpiresAt(minutes: number): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

// ── Vérification que l'OTP n'est pas expiré ───────────────────────────────
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
