/**
 * POST /api/ai/reorganize
 *
 * When a new high-priority task is added, asks Gemini to suggest
 * priority changes for existing tasks and applies them to Firestore.
 *
 * Body:    { newTaskTitle: string, newTaskPriority: "High"|"Medium"|"Low", newTaskDueDate?: string }
 * Response: { reorganized: Array<{ id, title, oldPriority, newPriority, reason }>, summary: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { geminiChat } from "@/lib/gemini";

type Priority = "High" | "Medium" | "Low";

interface TaskDoc {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: string;
  dueDate?: string;
  due_date?: string;
}

interface ReorganizeItem {
  id: string;
  title: string;
  oldPriority: Priority;
  newPriority: Priority;
  reason: string;
}

export async function POST(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { newTaskTitle, newTaskPriority, newTaskDueDate } = body as {
      newTaskTitle?: string;
      newTaskPriority?: Priority;
      newTaskDueDate?: string;
    };

    if (!newTaskTitle?.trim()) {
      return NextResponse.json({ error: "newTaskTitle is required." }, { status: 400 });
    }

    // 1. Fetch all existing tasks from Firestore
    const tasksRef = collection(db, "users", uid, "tasks");
    const snap = await getDocs(tasksRef);
    const tasks: TaskDoc[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TaskDoc, "id">),
    }));

    // Filter out completed tasks — no point reorganizing them
    const activeTasks = tasks.filter((t) => t.status !== "Completed");

    if (activeTasks.length === 0) {
      return NextResponse.json({
        reorganized: [],
        summary: "No active tasks to reorganize.",
      });
    }

    // 2. Build Gemini prompt
    const taskListText = activeTasks
      .map(
        (t) =>
          `- ID: ${t.id} | Title: "${t.title}" | Priority: ${t.priority} | Status: ${t.status} | Due: ${t.dueDate || t.due_date || "not set"}`
      )
      .join("\n");

    const dueDateText = newTaskDueDate ? ` due on ${newTaskDueDate}` : "";
    const prompt = `A new ${newTaskPriority ?? "High"} priority task has been added: "${newTaskTitle}"${dueDateText}.

Here are the user's current active tasks:
${taskListText}

Based on the urgency of the new task, suggest which existing tasks should have their priority changed to better reflect the overall workload. Only suggest changes that make logical sense — don't change every task.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation outside the JSON):
{
  "reorganized": [
    {
      "id": "<task id>",
      "title": "<task title>",
      "oldPriority": "<current priority>",
      "newPriority": "<suggested priority>",
      "reason": "<one sentence reason>"
    }
  ],
  "summary": "<one sentence summary of what changed and why>"
}

If no changes are needed, return an empty reorganized array with an appropriate summary.`;

    // 3. Call Gemini
    const { text } = await geminiChat([], prompt);

    // 4. Parse Gemini response — strip markdown code fences if present
    let parsed: { reorganized: ReorganizeItem[]; summary: string };
    try {
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[reorganize] Failed to parse Gemini JSON:", text);
      return NextResponse.json({
        reorganized: [],
        summary: "AI response could not be parsed. No changes were made.",
      });
    }

    const reorganized = parsed.reorganized ?? [];

    // 5. Apply priority changes to Firestore
    const validPriorities: Priority[] = ["High", "Medium", "Low"];
    const updates = reorganized.filter(
      (item) =>
        item.id &&
        validPriorities.includes(item.newPriority) &&
        item.newPriority !== item.oldPriority
    );

    await Promise.all(
      updates.map((item) =>
        updateDoc(doc(db, "users", uid, "tasks", item.id), {
          priority: item.newPriority,
        })
      )
    );

    return NextResponse.json({
      reorganized: updates,
      summary: parsed.summary ?? `AI reorganized ${updates.length} task(s).`,
    });
  } catch (err: any) {
    console.error("[POST /api/ai/reorganize]", err);
    return NextResponse.json(
      { error: `Failed to reorganize tasks: ${err?.message ?? "Unknown error"}` },
      { status: 500 }
    );
  }
}
