/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 *
 * Returns:
 *   - accessToken  (15 min, in response body)
 *   - refreshToken (30 days, in httpOnly cookie "flowai_refresh")
 *   - user object
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  signAccessToken,
  signRefreshToken,
  REFRESH_COOKIE,
  REFRESH_TOKEN_TTL,
  refreshCookieOptions,
} from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // ── Look up user ──────────────────────────────────────────────────────────
    const q = query(
      collection(db, "registeredUsers"),
      where("email", "==", email.toLowerCase())
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const userDoc = snap.docs[0].data() as {
      id: string;
      name: string;
      email: string;
      passwordHash: string;
      role: string;
      timezone: string;
      created_at: string;
    };

    // ── Verify password ───────────────────────────────────────────────────────
    const match = await bcrypt.compare(password, userDoc.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const tokenPayload = { uid: userDoc.id, email: userDoc.email, role: userDoc.role };

    // ── Issue tokens ──────────────────────────────────────────────────────────
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    const res = NextResponse.json({
      accessToken,
      expiresIn: 15 * 60, // seconds
      user: {
        id: userDoc.id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        timezone: userDoc.timezone,
        created_at: userDoc.created_at,
      },
    });

    // Set refresh token in httpOnly cookie
    res.cookies.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions(REFRESH_TOKEN_TTL));

    return res;
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
