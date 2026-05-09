/**
 * GET  /api/tasks        — list all tasks for the authenticated user
 * POST /api/tasks        — create a new task
 *
 * All routes protected by JWT middleware (x-user-uid injected by middleware).
 *
 * Task schema:
 *   id           string   (Firestore doc ID)
 *   user_id      string   (FK → registeredUsers)
 *   title        string
 *   description  string
 *   due_date     string   (ISO datetime or date string)
 *   priority     "low" | "medium" | "high"
 *   status       "todo" | "in-progress" | "done"
 *   created_at   string
 *   updated_at   string
 */

import { NextRequest, NextResponse } from "next/server";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const VALID_PRIORITIES = ["low", "medium", "high"] as const;
const VALID_STATUSES   = ["todo", "in-progress", "done"] as const;

type Priority = (typeof VALID_PRIORITIES)[number];
type Status   = (typeof VALID_STATUSES)[number];

// ── GET /api/tasks ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = req.nextUrl;
    const statusFilter   = searchParams.get("status");
    const priorityFilter = searchParams.get("priority");

    const tasksRef = collection(db, "users", uid, "tasks");
    let q = query(tasksRef, orderBy("created_at", "desc"));

    // Apply optional filters
    if (statusFilter && VALID_STATUSES.includes(statusFilter as Status)) {
      q = query(tasksRef, where("status", "==", statusFilter), orderBy("created_at", "desc"));
    } else if (priorityFilter && VALID_PRIORITIES.includes(priorityFilter as Priority)) {
      q = query(tasksRef, where("priority", "==", priorityFilter), orderBy("created_at", "desc"));
    }

    const snap = await getDocs(q);
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ tasks, count: tasks.length });
  } catch (err) {
    console.error("[GET /api/tasks]", err);
    return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  }
}

// ── POST /api/tasks ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, due_date, priority, status } = body as {
      title?: string;
      description?: string;
      due_date?: string;
      priority?: string;
      status?: string;
    };

    // ── Validation ────────────────────────────────────────────────────────────
    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }

    const resolvedPriority: Priority = VALID_PRIORITIES.includes(priority as Priority)
      ? (priority as Priority)
      : "medium";

    const resolvedStatus: Status = VALID_STATUSES.includes(status as Status)
      ? (status as Status)
      : "todo";

    const now = new Date().toISOString();

    const taskData = {
      user_id:     uid,
      title:       title.trim(),
      description: description?.trim() ?? "",
      due_date:    due_date ?? "",
      priority:    resolvedPriority,
      status:      resolvedStatus,
      created_at:  now,
      updated_at:  now,
    };

    const ref = await addDoc(collection(db, "users", uid, "tasks"), taskData);

    return NextResponse.json(
      { task: { id: ref.id, ...taskData } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/tasks]", err);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}
