/**
 * Next.js Edge Middleware — JWT access token protection for /api routes.
 *
 * Public routes (no token needed):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/refresh
 *   POST /api/auth/logout
 *
 * Protected routes: all other /api/*
 *   Expects: Authorization: Bearer <accessToken>
 *   On success: injects x-user-uid, x-user-email, x-user-role headers
 *   On failure: 401 JSON
 *
 * Token refresh flow:
 *   1. Client receives accessToken (15 min) in response body
 *   2. Client stores refreshToken in httpOnly cookie (set by server)
 *   3. When accessToken expires, client calls POST /api/auth/refresh
 *   4. Server reads cookie, issues new accessToken
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";

const PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow public auth routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Extract Bearer access token
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required. Provide Authorization: Bearer <accessToken>." },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyAccessToken(token);

    const headers = new Headers(req.headers);
    headers.set("x-user-uid",   String(payload.uid ?? ""));
    headers.set("x-user-email", String(payload.email ?? ""));
    headers.set("x-user-role",  String(payload.role ?? "user"));

    return NextResponse.next({ request: { headers } });
  } catch (err: any) {
    const expired = err?.code === "ERR_JWT_EXPIRED";
    return NextResponse.json(
      {
        error: expired
          ? "Access token expired. Call POST /api/auth/refresh to get a new one."
          : "Invalid access token.",
      },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
