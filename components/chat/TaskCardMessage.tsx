"use client";

import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";
import { TaskCardData } from "@/types/chat";
import PriorityBadge from "@/components/tasks/PriorityBadge";

export default function TaskCardMessage({ taskCard }: { taskCard: TaskCardData }) {
  return (
    <div className="mt-1 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-[var(--color-accent)]/10 px-4 py-2 dark:border-white/10">
        <Sparkles size={12} className="text-[var(--color-accent)]" />
        <span className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-accent)]">Task Created</span>
      </div>
      <div className="space-y-3 bg-white p-4 dark:bg-[#16161a]">
        <div>
          <p className="text-sm font-semibold">{taskCard.title}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{taskCard.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
            <CalendarDays size={12} /> {taskCard.dueDate}
          </span>
          <PriorityBadge priority={taskCard.priority} />
        </div>
        <div className="flex gap-2 pt-1">
          <Link
            href="/dashboard/tasks"
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white"
          >
            View Task
          </Link>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:text-zinc-400"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

