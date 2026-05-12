"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { Task } from "@/types/task";
import PriorityBadge from "./PriorityBadge";
import StatusToggle from "./StatusToggle";

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSubtask,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string, completed: boolean) => void;
}) {
  return (
    <motion.article
      layout
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => {
        try { e.dataTransfer?.setData("text/plain", task.id); } catch {}
      }}
      className={`rounded-2xl border p-4 ${task.status === "Completed" ? "opacity-60" : ""} border-slate-200 bg-white dark:border-white/10 dark:bg-[#16161a]`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={`text-sm font-semibold ${task.status === "Completed" ? "line-through" : ""}`}>{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>
      <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">{task.description}</p>
      {/* Subtasks preview */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 space-y-1">
          {task.subtasks.slice(0, 3).map((st) => (
            <label key={st.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={st.completed}
                onChange={() => onToggleSubtask?.(task.id, st.id, !st.completed)}
                className="size-4 rounded"
                aria-label={`Toggle subtask ${st.title}`}
              />
              <span className={st.completed ? "line-through text-slate-500" : ""}>{st.title}</span>
            </label>
          ))}
          {task.subtasks.length > 3 && <div className="text-xs text-slate-400">+{task.subtasks.length - 3} more</div>}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-zinc-500">{task.dueDate}</span>
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold dark:bg-white/10">
          {task.assignee}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <StatusToggle id={task.id} status={task.status} onChange={onStatusChange} />
        <div className="flex gap-1">
          <button type="button" onClick={onEdit} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10" aria-label={`Edit ${task.title}`}>
            <Pencil size={14} />
          </button>
          <button type="button" onClick={onDelete} className="rounded-full p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" aria-label={`Delete ${task.title}`}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
