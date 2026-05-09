/**
 * GET /api/events/calendar
 *
 * Returns calendar events AND tasks (formatted as calendar events) for the
 * authenticated user, merged into a single sorted list.
 *
 * Query parameters (all optional):
 *   from      YYYY-MM-DD  — include events on or after this date
 *   to        YYYY-MM-DD  — include events on or before this date
 *   status    "completed" | "upcoming" | "all"  (default: "all")
 *   type      "task" | "meeting" | "focus" | "deadline" | "all"  (default: "all")
 *
 * Response shape:
 *   {
 *     events: CalendarEventDTO[],
 *     count:  number,
 *     filters: { from, to, status, type }
 *   }
 *
 * CalendarEventDTO:
 *   id          string
 *   title       string
 *   description string
 *   date        string   YYYY-MM-DD
 *   startTime   string   HH:MM
 *   endTime     string   HH:MM
 *   type        "task" | "meeting" | "focus" | "deadline"
 *   priority    "High" | "Medium" | "Low"
 *   completed   boolean
 *   source      "calendar" | "task"   — where the event came from
 */

import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = "task" | "meeting" | "focus" | "deadline";
type Priority  = "High" | "Medium" | "Low";
type Status    = "completed" | "upcoming" | "all";

interface CalendarEventDoc {
  title:        string;
  description?: string;
  date:         string;
  startTime:    string;
  endTime:      string;
  type:         string;
  priority:     string;
  completed:    boolean;
}

interface TaskDoc {
  title:       string;
  description: string;
  due_date:    string;   // ISO datetime or date string
  priority:    string;   // "low" | "medium" | "high"
  status:      string;   // "todo" | "in-progress" | "done"
}

interface CalendarEventDTO {
  id:          string;
  title:       string;
  description: string;
  date:        string;
  startTime:   string;
  endTime:     string;
  type:        EventType;
  priority:    Priority;
  completed:   boolean;
  source:      "calendar" | "task";
}

// ── Validation helpers ────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const VALID_STATUSES: Status[]    = ["completed", "upcoming", "all"];
const VALID_TYPES:    EventType[] = ["task", "meeting", "focus", "deadline"];

function validateParams(params: URLSearchParams): {
  from:   string | null;
  to:     string | null;
  status: Status;
  type:   EventType | "all";
  error?: string;
} {
  const from   = params.get("from");
  const to     = params.get("to");
  const status = (params.get("status") ?? "all") as Status;
  const type   = (params.get("type")   ?? "all") as EventType | "all";

  if (from && !DATE_RE.test(from)) {
    return { from, to, status, type, error: `"from" must be YYYY-MM-DD, got "${from}"` };
  }
  if (to && !DATE_RE.test(to)) {
    return { from, to, status, type, error: `"to" must be YYYY-MM-DD, got "${to}"` };
  }
  if (from && to && from > to) {
    return { from, to, status, type, error: `"from" (${from}) must not be after "to" (${to})` };
  }
  if (!VALID_STATUSES.includes(status)) {
    return { from, to, status, type, error: `"status" must be one of: ${VALID_STATUSES.join(", ")}` };
  }
  if (type !== "all" && !VALID_TYPES.includes(type as EventType)) {
    return { from, to, status, type, error: `"type" must be one of: ${[...VALID_TYPES, "all"].join(", ")}` };
  }

  return { from, to, status, type };
}

// ── Normalise priority casing ─────────────────────────────────────────────────

function normalisePriority(raw: string): Priority {
  const map: Record<string, Priority> = {
    high: "High", medium: "Medium", low: "Low",
    High: "High", Medium: "Medium", Low: "Low",
  };
  return map[raw] ?? "Medium";
}

// ── Convert a task doc → CalendarEventDTO ─────────────────────────────────────
// Tasks with a due_date get a 1-hour block starting at 09:00 by default.
// If the due_date includes a time component (ISO datetime), that time is used.

function taskToEvent(id: string, task: TaskDoc): CalendarEventDTO | null {
  if (!task.due_date) return null;

  let date      = "";
  let startTime = "09:00";

  // ISO datetime: "2026-05-22T14:30" or "2026-05-22T14:30:00.000Z"
  if (/^\d{4}-\d{2}-\d{2}T/.test(task.due_date)) {
    const d = new Date(task.due_date);
    if (isNaN(d.getTime())) return null;
    date      = d.toISOString().slice(0, 10);
    startTime = d.toTimeString().slice(0, 5); // "HH:MM"
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(task.due_date)) {
    date = task.due_date;
  } else {
    // Human-readable strings like "Today, 3:00 PM" — skip, can't reliably parse
    return null;
  }

  // endTime = startTime + 1 hour
  const [hh, mm] = startTime.split(":").map(Number);
  const endHour   = (hh + 1) % 24;
  const endTime   = `${String(endHour).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

  return {
    id,
    title:       task.title,
    description: task.description ?? "",
    date,
    startTime,
    endTime,
    type:      "task",
    priority:  normalisePriority(task.priority),
    completed: task.status === "done",
    source:    "task",
  };
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Validate query params ──────────────────────────────────────────────────
  const { from, to, status, type, error } = validateParams(req.nextUrl.searchParams);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    // Fetch both collections in parallel
    const [calSnap, taskSnap] = await Promise.all([
      getDocs(collection(db, "users", uid, "calendarEvents")),
      getDocs(collection(db, "users", uid, "tasks")),
    ]);

    const events: CalendarEventDTO[] = [];

    // ── Calendar events ────────────────────────────────────────────────────
    for (const d of calSnap.docs) {
      const ev = d.data() as CalendarEventDoc;
      events.push({
        id:          d.id,
        title:       ev.title       ?? "",
        description: ev.description ?? "",
        date:        ev.date        ?? "",
        startTime:   ev.startTime   ?? "00:00",
        endTime:     ev.endTime     ?? "00:00",
        type:        (VALID_TYPES.includes(ev.type as EventType) ? ev.type : "meeting") as EventType,
        priority:    normalisePriority(ev.priority),
        completed:   ev.completed   ?? false,
        source:      "calendar",
      });
    }

    // ── Tasks formatted as calendar events ────────────────────────────────
    for (const d of taskSnap.docs) {
      const dto = taskToEvent(d.id, d.data() as TaskDoc);
      if (dto) events.push(dto);
    }

    // ── Apply filters ──────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);

    const filtered = events.filter((ev) => {
      // Date range
      if (from && ev.date < from) return false;
      if (to   && ev.date > to)   return false;

      // Status
      if (status === "completed" && !ev.completed)          return false;
      if (status === "upcoming"  && (ev.completed || ev.date < today)) return false;

      // Type
      if (type !== "all" && ev.type !== type) return false;

      return true;
    });

    // Sort by date asc, then startTime asc
    filtered.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      return dateCmp !== 0 ? dateCmp : a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({
      events:  filtered,
      count:   filtered.length,
      filters: { from, to, status, type },
    });
  } catch (err) {
    console.error("[GET /api/events/calendar]", err);
    return NextResponse.json({ error: "Failed to fetch calendar events." }, { status: 500 });
  }
}
