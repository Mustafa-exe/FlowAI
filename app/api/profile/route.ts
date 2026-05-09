/**
 * GET  /api/profile  — returns the authenticated user's full profile
 * PUT  /api/profile  — updates profile fields
 *
 * ── No N+1 queries ────────────────────────────────────────────────────────────
 * All sub-documents (profile/info + preferences/workspace + analytics/summary)
 * are fetched in a single Promise.all — one parallel batch, not sequential reads.
 * Returns a single nested JSON object with all user data.
 */

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, getDocs, collection, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── GET /api/profile ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid   = req.headers.get("x-user-uid");
  const email = req.headers.get("x-user-email");
  const role  = req.headers.get("x-user-role");

  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    // Fetch all user sub-documents in parallel — single round-trip, no N+1
    const [profileSnap, prefsSnap, analyticsSnap, taskCountSnap] = await Promise.all([
      getDoc(doc(db, "users", uid, "profile", "info")),
      getDoc(doc(db, "users", uid, "preferences", "workspace")),
      getDoc(doc(db, "users", uid, "analytics", "summary")),
      getDocs(collection(db, "users", uid, "tasks")),
    ]);

    const profile     = profileSnap.exists()   ? profileSnap.data()   : {};
    const prefs       = prefsSnap.exists()     ? prefsSnap.data()     : {};
    const analytics   = analyticsSnap.exists() ? analyticsSnap.data() : {};

    // Compute task stats from the already-fetched snapshot (no extra query)
    const tasks = taskCountSnap.docs.map((d) => d.data());
    const taskStats = {
      total:       tasks.length,
      completed:   tasks.filter((t) => t.status === "Completed" || t.status === "done").length,
      pending:     tasks.filter((t) => t.status === "Pending"   || t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "In Progress" || t.status === "in-progress").length,
    };

    return NextResponse.json({
      user: {
        id:           uid,
        email:        email ?? profile.email ?? "",
        role:         role  ?? profile.role  ?? "user",
        displayName:  profile.displayName ?? "",
        username:     profile.username    ?? "",
        avatarUrl:    profile.avatarUrl   ?? null,
        timezone:     prefs.workingHours?.timezone ?? profile.timezone ?? "UTC",
        created_at:   profile.createdAt   ?? null,
      },
      preferences: {
        theme:        prefs.appearance?.themeVariant ?? "modern-light",
        compactMode:  prefs.appearance?.compactMode  ?? false,
        fontSize:     prefs.appearance?.fontSizePreset ?? "M",
        notifications: prefs.notifications ?? {},
        workingHours:  prefs.workingHours  ?? {},
        integrations:  prefs.integrations  ?? {},
      },
      analytics: {
        productivityScore: analytics.productivityScore ?? 0,
        tasksCompleted:    analytics.tasksCompleted    ?? 0,
        avgFocusMinutes:   analytics.avgFocusMinutes   ?? 0,
        weeklyGoal:        analytics.weeklyGoal        ?? 10,
      },
      taskStats,
    });
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

// ─── PUT /api/profile ─────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { displayName, username, avatarUrl, timezone } = body as {
      displayName?: string;
      username?:    string;
      avatarUrl?:   string | null;
      timezone?:    string;
    };

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (displayName !== undefined) patch.displayName = displayName;
    if (username    !== undefined) patch.username    = username.toLowerCase();
    if (avatarUrl   !== undefined) patch.avatarUrl   = avatarUrl;
    if (timezone    !== undefined) patch.timezone    = timezone;

    await setDoc(doc(db, "users", uid, "profile", "info"), patch, { merge: true });

    return NextResponse.json({ message: "Profile updated.", updated: patch });
  } catch (err) {
    console.error("[PUT /api/profile]", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
