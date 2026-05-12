"use client";

import { motion } from "framer-motion";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Task } from "@/types/task";
import PriorityBadge from "./PriorityBadge";
import StatusToggle from "./StatusToggle";

function formatDueDate(raw: string): string {
  if (!raw) return "—";
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en", { month: "short", day: "numeric" }) +
        ", " + d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw + "T00:00");
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  return raw;
}

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function TaskRow({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string, completed: boolean) => void;
}) {
  return (
    <motion.div variants={rowVariants} className="w-full">
      <div
        className={`${
          task.status === "Completed" ? "opacity-50" : ""
        } group grid grid-cols-[28px_1fr_130px_140px_140px_80px_80px] items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/3`}
      >
        <input
          type="checkbox"
          checked={task.status === "Completed"}
          onChange={(event) => onStatusChange(task.id, event.target.checked ? "Completed" : "Pending")}
          className="size-4 rounded border-slate-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
          aria-label={`Mark ${task.title} as completed`}
        />
        <div>
          <motion.span
            layout
            animate={{
              textDecorationLine: task.status === "Completed" ? "line-through" : "none",
              opacity: task.status === "Completed" ? 0.6 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={task.status === "Completed" ? "text-slate-400 dark:text-zinc-500" : "font-medium"}
          >
            {task.title}
          </motion.span>
          {/* subtasks inline */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-1 flex gap-2">
              {task.subtasks.slice(0, 2).map((st) => (
                <label key={st.id} className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <input type="checkbox" checked={st.completed} onChange={() => onToggleSubtask?.(task.id, st.id, !st.completed)} className="size-4 rounded" />
                  <span className={st.completed ? "line-through text-slate-400" : ""}>{st.title}</span>
                </label>
              ))}
              {task.subtasks.length > 2 && <span className="text-xs text-slate-400">+{task.subtasks.length - 2}</span>}
            </div>
          )}
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">{task.description}</p>
        </div>
        <PriorityBadge priority={task.priority} />
        <span className="text-xs text-slate-600 dark:text-zinc-400">{formatDueDate(task.dueDate)}</span>
        <StatusToggle id={task.id} status={task.status} onChange={onStatusChange} />
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs font-semibold text-[var(--color-accent)] dark:bg-[var(--color-accent)]/20" title={task.assignee}>
          {task.assignee ? task.assignee.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "—"}
        </span>
        <div className="flex items-center justify-end gap-0.5">
          <button type="button" onClick={onEdit} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10" aria-label={`Edit ${task.title}`}>
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onDelete} className="rounded-full p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" aria-label={`Delete ${task.title}`}>
            <Trash2 size={13} />
          </button>
          <button type="button" className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10" aria-label={`More options for ${task.title}`}>
            <MoreVertical size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
