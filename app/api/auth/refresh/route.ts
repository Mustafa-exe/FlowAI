/**
 * POST /api/auth/refresh
 *
 * Reads the httpOnly "flowai_refresh" cookie and issues a new access token.
 * No body required.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  signAccessToken,
  REFRESH_COOKIE,
} from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token. Please log in again." },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    const accessToken = await signAccessToken({
      uid: payload.uid,
      email: payload.email,
      role: payload.role,
    });

    return NextResponse.json({
      accessToken,
      expiresIn: 15 * 60,
    });
  } catch {
    return NextResponse.json(
      { error: "Refresh token expired or invalid. Please log in again." },
      { status: 401 }
    );
  }
}
