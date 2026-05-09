/**
 * GET /api/auth/me
 *
 * Protected route — requires valid JWT.
 * Returns the authenticated user's profile from Firestore.
 */

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req: NextRequest) {
  // uid injected by middleware after JWT verification
  const uid = req.headers.get("x-user-uid");
  const email = req.headers.get("x-user-email");
  const role = req.headers.get("x-user-role");

  if (!uid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snap = await getDoc(doc(db, "registeredUsers", uid));
    if (!snap.exists()) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const data = snap.data();
    return NextResponse.json({
      user: {
        id: uid,
        name: data.name,
        email: data.email,
        role: data.role,
        timezone: data.timezone,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
  }
}
