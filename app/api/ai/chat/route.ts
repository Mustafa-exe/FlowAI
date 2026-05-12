/**
 * POST /api/ai/chat
 *
 * Calls Gemini AI and returns the response.
 * The client (chat page) handles saving messages to Firestore.
 *
 * Body:  { message: string, history?: Array<{role, content}> }
 * Response: { reply, tasks_created }
 */

import { NextRequest, NextResponse } from "next/server";
import { geminiChat, type GeminiMessage } from "@/lib/gemini";
import { getCachedHistory, appendToCache } from "@/lib/chatCache";
import { parseTaskCommands, stripTaskBlocks } from "@/lib/taskParser";

const SYSTEM_PROMPT = `You are FlowAI, an intelligent productivity assistant.
You help users manage tasks, schedule events, and stay organized.

When a user asks you to create a task, add a task, or schedule something,
embed a task creation command in your response using this exact format:
[TASK_CREATE] {"title":"Task title","description":"Brief description","due_date":"YYYY-MM-DDTHH:MM","priority":"low|medium|high","status":"todo"} [/TASK_CREATE]

You can include multiple [TASK_CREATE] blocks in one response.
Always confirm what you created in natural language after the block.

For due_date: use ISO format (e.g. 2026-05-25T14:00). If no time is specified, use 09:00.
If no date is specified, leave due_date as an empty string.

── PRIORITY EVALUATION RULES ────────────────────────────────────────────────
Priority is determined by the NATURE and IMPORTANCE of the task, NOT just the due date.
Due date is only a secondary factor.

HIGH priority — only when the task is genuinely urgent or critical:
  • Work deadlines, client deliverables, exams, job interviews, medical emergencies
  • User explicitly says: urgent, ASAP, critical, emergency, must, deadline, important
  • Significant consequences if missed (submission, payment, presentation)
  • Example: "submit project by tomorrow", "urgent client call", "exam in 2 hours"

MEDIUM priority — normal tasks that need to get done:
  • Regular work tasks: meetings, reviews, writing, coding, preparing documents
  • Appointments that are planned (doctor checkup, dentist, scheduled calls)
  • Tasks due within a few days without urgency signals
  • Example: "schedule team meeting", "write report", "doctor appointment next week"

LOW priority — routine, personal, or flexible tasks:
  • Daily routines: wake up, eat, sleep, exercise, commute
  • Leisure and personal: lunch, dinner, coffee, watching something, reading
  • Flexible tasks: "someday", "eventually", "when I get a chance", "no rush"
  • Reminders without consequences: "remind me to call mom", "buy groceries"
  • Example: "have lunch tomorrow", "wake up at 4", "go for a walk", "buy milk"

CRITICAL RULE: Routine daily activities (eating, sleeping, waking up, personal errands)
are ALWAYS low priority regardless of when they are scheduled.
─────────────────────────────────────────────────────────────────────────────

Keep responses concise and helpful. You can also answer general productivity questions.`;

const DEFAULT_RETRY_AFTER_SECONDS = 30;

export async function POST(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { message, tasks } = body as {
      message?: string;
      tasks?: Array<{
        title: string;
        description: string;
        dueDate: string;
        priority: string;
        status: string;
      }>;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required." }, { status: 400 });
    }

    const userMessage = message.trim();

    // Build a context string from the user's real tasks
    let taskContext = "";
    if (tasks && tasks.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const taskList = tasks
        .map((t) => {
          const due = t.dueDate ? `due ${t.dueDate}` : "no due date";
          return `- "${t.title}" (${t.priority} priority, ${t.status}, ${due})`;
        })
        .join("\n");
      taskContext = `\n\nThe user's current tasks (from their FlowAI workspace):\n${taskList}\n\nToday's date is ${today}.`;
    } else {
      taskContext = `\n\nThe user currently has no tasks in their workspace. Today's date is ${new Date().toISOString().slice(0, 10)}.`;
    }

    // Get conversation context from in-memory cache
    const history: GeminiMessage[] = getCachedHistory(uid);

    // Call Gemini with task context injected into system prompt
    const today = new Date().toISOString().slice(0, 10);
    const systemWithContext = SYSTEM_PROMPT
      .replace("Today's date is ${today}.", "") // avoid duplicate if already in taskContext
      + `\n\nToday's date is ${today}.`
      + taskContext;
    const { text: rawReply } = await geminiChat(history, userMessage, systemWithContext);

    // Parse any task creation commands
    const parsedTasks = parseTaskCommands(rawReply);
    const cleanReply  = stripTaskBlocks(rawReply);

    // Update cache with this exchange
    appendToCache(uid, [
      { role: "user",  parts: [{ text: userMessage }] },
      { role: "model", parts: [{ text: rawReply }] },
    ]);

    return NextResponse.json({
      reply:         cleanReply || rawReply,
      tasks_created: parsedTasks,
    });

  } catch (err: any) {
    const msg = err?.message ?? "";
    console.error("[POST /api/ai/chat]", msg);

    if (msg.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI service not configured. Set GEMINI_API_KEY in environment variables." },
        { status: 503 }
      );
    }
    if (msg.includes("403") || msg.includes("API_KEY_INVALID")) {
      return NextResponse.json(
        { error: "Invalid Gemini API key." },
        { status: 503 }
      );
    }
    if (msg.includes("404")) {
      return NextResponse.json(
        { error: "Gemini model not found. Check the model name." },
        { status: 503 }
      );
    }
    if (msg.includes("429") || msg.includes("quota")) {
      const headers = new Headers();
      headers.set("Retry-After", String(DEFAULT_RETRY_AFTER_SECONDS));
      return NextResponse.json(
        { error: "AI rate limit reached. Please wait a moment.", retryAfterSeconds: DEFAULT_RETRY_AFTER_SECONDS },
        { status: 429, headers }
      );
    }

    return NextResponse.json(
      { error: `AI request failed: ${msg}` },
      { status: 500 }
    );
  }
}
