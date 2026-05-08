"use client";

import { Task } from "@/types/task";

export default function TaskInlinePanel({ task }: { task: Task }) {
  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-slate-700 dark:text-zinc-200">{task.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {task.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-zinc-300">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
