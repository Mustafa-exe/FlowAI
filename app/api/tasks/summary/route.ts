/**
 * GET /api/tasks/summary
 *
 * Returns a JSON summary of the authenticated user's tasks:
 *   {
 *     total:    number,
 *     byStatus: { todo: number, "in-progress": number, done: number },
 *     byPriority: { low: number, medium: number, high: number },
 *     overdue:  number   // non-done tasks whose due_date is in the past
 *   }
 *
 * Protected by JWT middleware (x-user-uid injected by middleware).
 */

import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Status   = "todo" | "in-progress" | "done";
type Priority = "low" | "medium" | "high";

interface TaskDoc {
  status:   string;
  priority: string;
  due_date: string;
}

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snap = await getDocs(collection(db, "users", uid, "tasks"));

    const byStatus: Record<Status, number> = {
      "todo":        0,
      "in-progress": 0,
      "done":        0,
    };

    const byPriority: Record<Priority, number> = {
      low:    0,
      medium: 0,
      high:   0,
    };

    const now = Date.now();
    let overdue = 0;

    for (const d of snap.docs) {
      const task = d.data() as TaskDoc;

      // ── Status counts ──────────────────────────────────────────────────────
      const status = task.status as Status;
      if (status in byStatus) {
        byStatus[status]++;
      }

      // ── Priority counts ────────────────────────────────────────────────────
      const priority = task.priority as Priority;
      if (priority in byPriority) {
        byPriority[priority]++;
      }

      // ── Overdue: non-done tasks with a past due_date ───────────────────────
      if (status !== "done" && task.due_date) {
        const due = new Date(task.due_date).getTime();
        if (!isNaN(due) && due < now) {
          overdue++;
        }
      }
    }

    return NextResponse.json({
      total:      snap.size,
      byStatus,
      byPriority,
      overdue,
    });
  } catch (err) {
    console.error("[GET /api/tasks/summary]", err);
    return NextResponse.json({ error: "Failed to fetch task summary." }, { status: 500 });
  }
}
