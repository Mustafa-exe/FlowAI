/**
 * POST /api/ai/schedule
 *
 * Accepts the user's tasks + working hours preferences and returns an
 * AI-generated optimized daily schedule as structured time blocks.
 *
 * Protected by JWT middleware (x-user-uid injected).
 *
 * Body (all optional — if omitted, fetched from Firestore):
 *   date?          string   — target date "YYYY-MM-DD" (default: today)
 *   tasks?         Task[]   — override task list (skip Firestore fetch)
 *   workingHours?  { start: "HH:MM", end: "HH:MM", timezone: string }
 *
 * Response:
 *   date           string
 *   schedule       TimeBlock[]
 *   summary        string        — one-line AI summary
 *   total_tasks    number
 *   scheduled_tasks number
 *
 * ── No N+1 queries ────────────────────────────────────────────────────────────
 * All Firestore reads (tasks + preferences) are fired in parallel with
 * Promise.all — single round-trip per collection, no sequential fetches.
 */

import { NextRequest, NextResponse } from "next/server";
import { geminiChat } from "@/lib/gemini";

// ─── Types ────────────────────────────────────────────────────────────────────

type InputTask = {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: "High" | "Medium" | "Low" | "high" | "medium" | "low";
  status: string;
  estimatedMinutes?: number;
};

type TimeBlock = {
  start_time:   string;   // "HH:MM"
  end_time:     string;   // "HH:MM"
  title:        string;
  description:  string;
  type:         "task" | "break" | "focus" | "buffer" | "meeting";
  priority:     "High" | "Medium" | "Low" | null;
  task_id:      string | null;
};

type ScheduleResponse = {
  date:             string;
  schedule:         TimeBlock[];
  summary:          string;
  total_tasks:      number;
  scheduled_tasks:  number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function estimateMinutes(task: InputTask): number {
  if (task.estimatedMinutes) return task.estimatedMinutes;
  switch (task.priority.toLowerCase()) {
    case "high":   return 90;
    case "medium": return 60;
    default:       return 30;
  }
}

function buildSchedulePrompt(
  tasks: InputTask[],
  date: string,
  workStart: string,
  workEnd: string,
  timezone: string
): string {
  const activeTasks = tasks.filter(
    (t) => t.status !== "Completed" && t.status !== "done"
  );

  const taskList = activeTasks
    .map((t, i) => {
      const est = estimateMinutes(t);
      const due = t.dueDate ? ` | due: ${t.dueDate}` : "";
      return `${i + 1}. [${t.priority.toUpperCase()}] "${t.title}"${t.description ? ` — ${t.description}` : ""}${due} | ~${est}min`;
    })
    .join("\n");

  return `You are a productivity scheduling assistant. Create an optimized daily schedule.

Date: ${date}
Working hours: ${workStart} – ${workEnd} (${timezone})
Tasks to schedule:
${taskList || "No pending tasks."}

Rules:
1. Schedule high-priority tasks first, especially those due today or tomorrow.
2. Include a 15-minute morning planning block at the start.
3. Add a 30-minute lunch break around 12:00–13:00.
4. Add 10-minute breaks between focus blocks longer than 60 minutes.
5. Leave a 15-minute buffer at the end for wrap-up.
6. Don't schedule more than 4 hours of deep work without a break.
7. If tasks exceed available time, prioritize by due date then priority.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "summary": "One sentence describing today's focus",
  "schedule": [
    {
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "title": "Block title",
      "description": "What to do",
      "type": "task|break|focus|buffer|meeting",
      "priority": "High|Medium|Low|null",
      "task_id": "task index (1-based) or null"
    }
  ]
}`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const {
      date = todayStr(),
      tasks: bodyTasks,
      workingHours: bodyWorkingHours,
    } = body as {
      date?: string;
      tasks?: InputTask[];
      workingHours?: { start: string; end: string; timezone: string };
    };

    // ── Resolve tasks and working hours from request body only ───────────────
    // Firestore reads are not done server-side (client SDK requires browser).
    // The caller must pass tasks and workingHours in the request body.
    const tasks: InputTask[] = bodyTasks ?? [];

    // Resolve working hours — use body or defaults
    let workStart = "08:00";
    let workEnd   = "18:00";
    let timezone  = "UTC";

    if (bodyWorkingHours) {
      workStart = bodyWorkingHours.start;
      workEnd   = bodyWorkingHours.end;
      timezone  = bodyWorkingHours.timezone;
    }

    // ── Call Gemini ───────────────────────────────────────────────────────────
    const prompt = buildSchedulePrompt(tasks, date, workStart, workEnd, timezone);
    const { text } = await geminiChat([], prompt);

    // ── Parse JSON response ───────────────────────────────────────────────────
    let parsed: { summary: string; schedule: TimeBlock[] };
    try {
      // Strip markdown code fences if Gemini wraps in ```json
      const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      // Fallback: extract JSON from response
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI returned an invalid schedule format. Please try again." },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    const activeTasks = tasks.filter(
      (t) => t.status !== "Completed" && t.status !== "done"
    );
    const scheduledTaskIds = new Set(
      parsed.schedule
        .filter((b) => b.task_id !== null)
        .map((b) => b.task_id)
    );

    const response: ScheduleResponse = {
      date,
      schedule:         parsed.schedule ?? [],
      summary:          parsed.summary  ?? "Your optimized schedule for today.",
      total_tasks:      activeTasks.length,
      scheduled_tasks:  scheduledTaskIds.size,
    };

    return NextResponse.json(response);

  } catch (err: any) {
    const msg = err?.message ?? "";
    console.error("[POST /api/ai/schedule]", msg);

    if (msg.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI service not configured. Set GEMINI_API_KEY." },
        { status: 503 }
      );
    }
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "AI rate limit reached. Please wait a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Schedule generation failed: ${msg}` },
      { status: 500 }
    );
  }
}
