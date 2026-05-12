"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Task } from "@/types/task";
import TaskRow from "./TaskRow";

export default function TaskListView({
  tasks,
  activeFilter,
  onFilterChange,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onToggleSubtask,
}: {
  tasks: Task[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string, completed: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    Pending: false,
    "In Progress": false,
    Completed: false,
    Backlog: true,
  });

  const filtered =
    activeFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status.toLowerCase() === activeFilter.toLowerCase());

  const groups = useMemo(
    () => ({
      Pending: filtered.filter((t) => t.status === "Pending"),
      "In Progress": filtered.filter((t) => t.status === "In Progress"),
      Completed: filtered.filter((t) => t.status === "Completed"),
      Backlog: filtered.filter((t) => t.status === "Backlog"),
    }),
    [filtered],
  );

  return (
    <section className="mt-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#16161a]">
        {/* Column headers */}
        <div className="grid grid-cols-[28px_1fr_130px_140px_140px_80px_80px] items-center gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:border-white/8 dark:text-zinc-500">
          <span />
          <span>Task Name</span>
          <span>Priority</span>
          <span>Due Date</span>
          <span>Status</span>
          <span>Assignee</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Groups */}
        {Object.entries(groups).map(([status, items]) => {
          if (items.length === 0) return null;
          const isClosed = collapsed[status];

          return (
            <div key={status} className="border-t border-slate-100 first:border-t-0 dark:border-white/5">
              {/* Group header */}
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [status]: !c[status] }))}
                className="flex w-full items-center gap-2.5 px-5 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-white/3"
                aria-expanded={!isClosed}
              >
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-slate-400 transition-transform dark:text-zinc-500 ${isClosed ? "-rotate-90" : ""}`}
                />
                <span className="text-sm font-semibold">{status}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-zinc-400">
                  {items.length}
                </span>
              </button>

              {/* Rows */}
              {!isClosed && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                  className="divide-y divide-slate-50 dark:divide-white/4"
                >
                  {items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task.id)}
                      onStatusChange={onStatusChange}
                      onToggleSubtask={onToggleSubtask}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
            No tasks match this filter.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500">
        <p>
          Showing {filtered.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
        {activeFilter !== "all" && (
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5"
          >
            Reset filter
          </button>
        )}
      </div>
    </section>
  );
}
