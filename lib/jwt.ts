/**
 * Shared JWT utilities for API routes.
 *
 * Token strategy:
 *   - Access token:  short-lived (15 min), sent in response body
 *   - Refresh token: long-lived (30 days), stored in httpOnly cookie "flowai_refresh"
 *
 * Uses `jose` for edge-compatible signing/verification (no Node.js crypto).
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ACCESS_SECRET  = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "flowai-dev-secret-change-in-production"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "flowai-refresh-secret-change-in-production"
);

export const ACCESS_TOKEN_TTL  = 15 * 60;          // 15 minutes (seconds)
export const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days (seconds)

export type TokenPayload = {
  uid: string;
  email: string;
  role: string;
};

// ── Sign ──────────────────────────────────────────────────────────────────────

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL}s`)
    .sign(REFRESH_SECRET);
}

// ── Verify ────────────────────────────────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<TokenPayload & JWTPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as TokenPayload & JWTPayload;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload & JWTPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as TokenPayload & JWTPayload;
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export const REFRESH_COOKIE = "flowai_refresh";

export function refreshCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
