/**
 * POST /api/auth/logout
 *
 * Clears the httpOnly refresh token cookie.
 */

import { NextResponse } from "next/server";
import { REFRESH_COOKIE } from "@/lib/jwt";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out successfully." });
  res.cookies.set(REFRESH_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
