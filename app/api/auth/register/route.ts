/**
 * POST /api/auth/register
 *
 * Body: { name, email, password, timezone?, role? }
 *
 * - Validates input
 * - Checks email uniqueness in Firestore
 * - Hashes password with bcrypt (cost factor 12)
 * - Creates Firebase Auth user
 * - Stores user profile in Firestore: users/{uid}/profile/info
 * - Returns signed JWT with { uid, email, role } in payload
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
    const { name, email, password, timezone, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      timezone?: string;
      role?: string;
    };

    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // ── Check email uniqueness in Firestore ───────────────────────────────────
    const usersRef = collection(db, "registeredUsers");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const existing = await getDocs(q);
    if (!existing.empty) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ── Hash password (bcrypt, cost 12) ───────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Create Firebase Auth user ─────────────────────────────────────────────
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }

    // ── Store user in Firestore ───────────────────────────────────────────────
    const userRole = role ?? "user";
    const now = new Date().toISOString();

    // registeredUsers/{uid} — for email uniqueness checks and password hash storage
    await setDoc(doc(db, "registeredUsers", uid), {
      id: uid,
      name: name ?? "",
      email: email.toLowerCase(),
      passwordHash,          // bcrypt hash — never returned to client
      timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      role: userRole,
      created_at: now,
    });

    // users/{uid}/profile/info — app profile
    await setDoc(doc(db, "users", uid, "profile", "info"), {
      displayName: name ?? email.split("@")[0],
      role: userRole,
      avatarUrl: null,
      createdAt: now,
    });

    // ── Sign tokens ───────────────────────────────────────────────────────────
    const tokenPayload = { uid, email: email.toLowerCase(), role: userRole };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    const res = NextResponse.json(
      {
        accessToken,
        expiresIn: 15 * 60,
        user: {
          id: uid,
          name: name ?? "",
          email: email.toLowerCase(),
          role: userRole,
          timezone: timezone ?? "",
          created_at: now,
        },
      },
      { status: 201 }
    );

    res.cookies.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions(REFRESH_TOKEN_TTL));
    return res;
  } catch (err: any) {
    const code = err?.code ?? "";
    if (code === "auth/email-already-in-use") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    if (code === "auth/weak-password") {
      return NextResponse.json(
        { error: "Password is too weak. Use at least 8 characters." },
        { status: 400 }
      );
    }
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
