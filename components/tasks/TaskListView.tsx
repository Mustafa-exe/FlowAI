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
}: {
  tasks: Task[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    Pending: false,
    "In Progress": false,
    Completed: false,
    Backlog: true,
  });

  const filtered = activeFilter === "all" ? tasks : tasks.filter((task) => task.status.toLowerCase() === activeFilter.toLowerCase());
  const groups = useMemo(
    () => ({
      Pending: filtered.filter((task) => task.status === "Pending"),
      "In Progress": filtered.filter((task) => task.status === "In Progress"),
      Completed: filtered.filter((task) => task.status === "Completed"),
      Backlog: filtered.filter((task) => task.status === "Backlog"),
    }),
    [filtered],
  );

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-[#16161a]">
        <div className="grid grid-cols-[24px_1fr_120px_120px_130px_56px_70px] gap-4 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
          <span />
          <span>Task Name</span>
          <span>Priority</span>
          <span>Due Date</span>
          <span>Status</span>
          <span>Assignee</span>
          <span className="text-right">Actions</span>
        </div>
        {Object.entries(groups).map(([status, items]) => {
          if (items.length === 0) {
            return null;
          }

          const isClosed = collapsed[status];

          return (
            <div key={status} className="border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setCollapsed((current) => ({ ...current, [status]: !current[status] }))}
                className="flex w-full items-center gap-2 px-4 py-3 text-left"
                aria-expanded={!isClosed}
              >
                <ChevronDown size={14} className={`transition-transform ${isClosed ? "-rotate-90" : ""}`} />
                <span className="text-sm font-semibold">{status}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-zinc-400">{items.length}</span>
              </button>
              {!isClosed ? (
                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="space-y-1 pb-2">
                  {items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task.id)}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                </motion.div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-500">
        <p>Showing {filtered.length} of {tasks.length} tasks</p>
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 dark:border-white/10">
          <button type="button" onClick={() => onFilterChange("all")} className="px-2 py-0.5">
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
