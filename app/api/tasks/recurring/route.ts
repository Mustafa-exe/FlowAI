/**
 * GET    /api/tasks/recurring        — list recurring rules for user
 * POST   /api/tasks/recurring        — create a new recurring rule
 * DELETE /api/tasks/recurring?id=X   — delete a rule
 *
 * Uses Firestore REST API for server-side operations with user's Firebase ID token.
 */

import { NextRequest, NextResponse } from "next/server";

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

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "flowai-968d4";
const API_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function listDocuments(uid: string, token: string) {
  const url = `${API_URL}/users/${uid}/recurringRules`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Firestore REST] GET failed:", res.status, err);
    throw new Error(`Firestore error: ${res.status}`);
  }

  const data = await res.json();
  const rules: RecurringRule[] = (data.documents ?? []).map((doc: any) => {
    const fields = doc.fields;
    return {
      id: doc.name.split("/").pop(),
      title: fields.title?.stringValue || "",
      description: fields.description?.stringValue || "",
      priority: fields.priority?.stringValue || "Medium",
      frequency: fields.frequency?.stringValue || "daily",
      dayOfWeek: fields.dayOfWeek?.integerValue,
      dayOfMonth: fields.dayOfMonth?.integerValue,
      time: fields.time?.stringValue || "09:00",
      active: fields.active?.booleanValue ?? true,
      lastGenerated: fields.lastGenerated?.stringValue,
      createdAt: fields.createdAt?.stringValue || new Date().toISOString(),
    };
  });
  return rules;
}

async function createDocument(uid: string, token: string, rule: Omit<RecurringRule, "id">) {
  // Transform rule to Firestore format
  const fields: Record<string, any> = {
    title: { stringValue: rule.title },
    description: { stringValue: rule.description },
    priority: { stringValue: rule.priority },
    frequency: { stringValue: rule.frequency },
    time: { stringValue: rule.time },
    active: { booleanValue: rule.active },
    createdAt: { stringValue: rule.createdAt },
  };

  if (rule.dayOfWeek !== undefined) {
    fields.dayOfWeek = { integerValue: rule.dayOfWeek };
  }
  if (rule.dayOfMonth !== undefined) {
    fields.dayOfMonth = { integerValue: rule.dayOfMonth };
  }

  const url = `${API_URL}/users/${uid}/recurringRules`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Firestore REST] POST failed:", res.status, err);
    throw new Error(`Firestore error: ${res.status}`);
  }

  const data = await res.json();
  const docId = data.name.split("/").pop();
  return { id: docId, ...rule };
}

async function deleteDocument(uid: string, token: string, docId: string) {
  const url = `${API_URL}/users/${uid}/recurringRules/${docId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Firestore REST] DELETE failed:", res.status, err);
    throw new Error(`Firestore error: ${res.status}`);
  }

  return true;
}

// ── GET /api/tasks/recurring ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  const token = req.headers.get("x-firebase-token");
  
  if (!uid || !token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const rules = await listDocuments(uid, token);
    console.log("[GET /api/tasks/recurring] Fetched", rules.length, "rules for", uid);
    return NextResponse.json({ rules });
  } catch (err: any) {
    console.error("[GET /api/tasks/recurring]", err);
    return NextResponse.json({ error: "Failed to fetch recurring rules." }, { status: 500 });
  }
}

// ── POST /api/tasks/recurring ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  const token = req.headers.get("x-firebase-token");
  
  if (!uid || !token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

    const createdRule = await createDocument(uid, token, rule);
    console.log("[POST /api/tasks/recurring] Created rule", createdRule.id, "for", uid);
    return NextResponse.json({ rule: createdRule }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/tasks/recurring]", err);
    return NextResponse.json({ error: "Failed to create recurring rule." }, { status: 500 });
  }
}

// ── DELETE /api/tasks/recurring?id=X ──────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  const token = req.headers.get("x-firebase-token");
  
  if (!uid || !token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const ruleId = searchParams.get("id");
  if (!ruleId) return NextResponse.json({ error: "id query param is required." }, { status: 400 });

  try {
    await deleteDocument(uid, token, ruleId);
    console.log("[DELETE /api/tasks/recurring] Deleted rule", ruleId, "for", uid);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/tasks/recurring]", err);
    return NextResponse.json({ error: "Failed to delete recurring rule." }, { status: 500 });
  }
}

