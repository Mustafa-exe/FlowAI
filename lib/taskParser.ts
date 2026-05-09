/**
 * Parses Gemini's response for task creation commands.
 *
 * Gemini is instructed to embed task JSON in its response like:
 *   [TASK_CREATE] {"title":"...","description":"...","due_date":"...","priority":"medium","status":"todo"} [/TASK_CREATE]
 *
 * This parser extracts those blocks and returns structured task data.
 */

export type ParsedTask = {
  title: string;
  description: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
};

const TASK_BLOCK_RE = /\[TASK_CREATE\]([\s\S]*?)\[\/TASK_CREATE\]/g;

export function parseTaskCommands(text: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  let match: RegExpExecArray | null;

  while ((match = TASK_BLOCK_RE.exec(text)) !== null) {
    try {
      const raw = JSON.parse(match[1].trim());
      tasks.push({
        title:       String(raw.title ?? "Untitled task"),
        description: String(raw.description ?? ""),
        due_date:    String(raw.due_date ?? ""),
        priority:    ["low", "medium", "high"].includes(raw.priority)
          ? raw.priority
          : "medium",
        status: ["todo", "in-progress", "done"].includes(raw.status)
          ? raw.status
          : "todo",
      });
    } catch {
      // Malformed JSON — skip
    }
  }

  return tasks;
}

/** Strip [TASK_CREATE]...[/TASK_CREATE] blocks from the visible response text */
export function stripTaskBlocks(text: string): string {
  return text.replace(TASK_BLOCK_RE, "").trim();
}
