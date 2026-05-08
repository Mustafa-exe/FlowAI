"use client";

import { motion } from "framer-motion";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Task } from "@/types/task";
import PriorityBadge from "./PriorityBadge";
import StatusToggle from "./StatusToggle";

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
}) {
  return (
    <motion.div variants={rowVariants} className="w-full">
      <div
        className={`${
          task.status === "Completed" ? "opacity-50" : ""
        } group grid grid-cols-[24px_1fr_120px_120px_130px_56px_70px] items-center gap-4 rounded-xl px-4 py-3 transition-colors duration-100 hover:bg-[var(--color-surface-hover)]`}
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
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">{task.description}</p>
        </div>
        <PriorityBadge priority={task.priority} />
        <span className="text-xs text-slate-600 dark:text-zinc-400">{task.dueDate}</span>
        <StatusToggle id={task.id} status={task.status} onChange={onStatusChange} />
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-zinc-100">
          {task.assignee}
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
