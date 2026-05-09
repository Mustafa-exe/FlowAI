/**
 * GET    /api/tasks/recurring        — list recurring rules for user
 * POST   /api/tasks/recurring        — create a new recurring rule
 * DELETE /api/tasks/recurring?id=X   — delete a rule
 */

import { NextRequest, NextResponse } from "next/server";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RecurringRule {
  id?: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;   // 0-6 for weekly
  dayOfMonth?: number;  // 1-31 for monthly
  time: string;         // "HH:MM"
  active: boolean;
  lastGenerated?: string; // ISO date
  createdAt: string;
}

const rulesCol = (uid: string) =>
  collection(db, "users", uid, "recurringRules");

// ── GET /api/tasks/recurring ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const snap = await getDocs(rulesCol(uid));
    const rules: RecurringRule[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<RecurringRule, "id">),
    }));
    return NextResponse.json({ rules });
  } catch (err: any) {
    console.error("[GET /api/tasks/recurring]", err);
    return NextResponse.json({ error: "Failed to fetch recurring rules." }, { status: 500 });
  }
}

// ── POST /api/tasks/recurring ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      priority,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      active,
    } = body as Partial<RecurringRule>;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }
    if (!["daily", "weekly", "monthly"].includes(frequency ?? "")) {
      return NextResponse.json({ error: "frequency must be daily, weekly, or monthly." }, { status: 400 });
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "time must be in HH:MM format." }, { status: 400 });
    }

    const rule: Omit<RecurringRule, "id"> = {
      title: title.trim(),
      description: description?.trim() ?? "",
      priority: (["High", "Medium", "Low"].includes(priority ?? "") ? priority : "Medium") as RecurringRule["priority"],
      frequency: frequency as RecurringRule["frequency"],
      time,
      active: active !== false,
      createdAt: new Date().toISOString(),
      ...(frequency === "weekly" && dayOfWeek !== undefined ? { dayOfWeek } : {}),
      ...(frequency === "monthly" && dayOfMonth !== undefined ? { dayOfMonth } : {}),
    };

    const ref = await addDoc(rulesCol(uid), rule);
    return NextResponse.json({ rule: { id: ref.id, ...rule } }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/tasks/recurring]", err);
    return NextResponse.json({ error: "Failed to create recurring rule." }, { status: 500 });
  }
}

// ── DELETE /api/tasks/recurring?id=X ─────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param is required." }, { status: 400 });

  try {
    await deleteDoc(doc(db, "users", uid, "recurringRules", id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/tasks/recurring]", err);
    return NextResponse.json({ error: "Failed to delete recurring rule." }, { status: 500 });
  }
}
