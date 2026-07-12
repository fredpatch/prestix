import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

// Ce qu'on encode dans chaque token
export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

// ── Options par défaut ────────────────────────────────────────────────────
const defaults: SignOptions & VerifyOptions = {
  audience: "prestix-users",
};

type SignOptionsAndSecret = SignOptions & {
  secret: string;
};

const accessTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "15m",
  secret: process.env.JWT_SECRET!,
};

const refreshTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "7d",
  secret: process.env.JWT_REFRESH_SECRET!,
};

// ── Access Token (courte durée : 15 min) ──────────────────────────────────
export function signAccessToken(payload: TokenPayload, options?: SignOptionsAndSecret): string {
  const { secret, ...signOpts } = options || accessTokenSignOptions;

  return jwt.sign(payload, secret, {
    ...defaults,
    ...signOpts,
  });
}

// ── Refresh Token (longue durée : 7 jours) ────────────────────────────────
export function signRefreshToken(payload: TokenPayload, options?: SignOptionsAndSecret): string {
  const { secret, ...signOpts } = options || refreshTokenSignOptions;
  return jwt.sign(payload, secret, { ...defaults, ...signOpts });
}

// ── Vérification Access Token ─────────────────────────────────────────────
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    ...defaults,
  }) as TokenPayload;
}

// ── Vérification Refresh Token ────────────────────────────────────────────
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
    ...defaults,
  }) as TokenPayload;
}
