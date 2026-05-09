/**
 * GET    /api/tasks/:id  — get a single task
 * PUT    /api/tasks/:id  — update a task (partial update supported)
 * DELETE /api/tasks/:id  — delete a task
 *
 * All routes protected by JWT middleware.
 * Users can only access their own tasks (user_id check).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const VALID_PRIORITIES = ["low", "medium", "high"] as const;
const VALID_STATUSES   = ["todo", "in-progress", "done"] as const;

type Priority = (typeof VALID_PRIORITIES)[number];
type Status   = (typeof VALID_STATUSES)[number];

function taskRef(uid: string, id: string) {
  return doc(db, "users", uid, "tasks", id);
}

// ── GET /api/tasks/:id ────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const snap = await getDoc(taskRef(uid, params.id));
    if (!snap.exists()) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const task = snap.data();
    // Ensure the task belongs to this user
    if (task.user_id !== uid) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({ task: { id: snap.id, ...task } });
  } catch (err) {
    console.error("[GET /api/tasks/:id]", err);
    return NextResponse.json({ error: "Failed to fetch task." }, { status: 500 });
  }
}

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const ref = taskRef(uid, params.id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (snap.data().user_id !== uid) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, due_date, priority, status } = body as {
      title?: string;
      description?: string;
      due_date?: string;
      priority?: string;
      status?: string;
    };

    // Build partial update — only include provided fields
    const patch: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined)       patch.title       = title.trim();
    if (description !== undefined) patch.description = description.trim();
    if (due_date !== undefined)    patch.due_date    = due_date;

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority as Priority)) {
        return NextResponse.json(
          { error: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` },
          { status: 400 }
        );
      }
      patch.priority = priority;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status as Status)) {
        return NextResponse.json(
          { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      patch.status = status;
    }

    await updateDoc(ref, patch);

    const updated = await getDoc(ref);
    return NextResponse.json({ task: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error("[PUT /api/tasks/:id]", err);
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }
}

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const ref = taskRef(uid, params.id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (snap.data().user_id !== uid) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await deleteDoc(ref);
    return NextResponse.json({ message: "Task deleted successfully." });
  } catch (err) {
    console.error("[DELETE /api/tasks/:id]", err);
    return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
  }
}
