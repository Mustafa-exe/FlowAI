"use client";

import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";

const columns: Array<{ status: Task["status"]; label: string }> = [
  { status: "Backlog", label: "Backlog" },
  { status: "Pending", label: "Pending" },
  { status: "In Progress", label: "In Progress" },
  { status: "Completed", label: "Completed" },
];

const columnColors: Record<Task["status"], string> = {
  Backlog: "border-gray-400",
  Pending: "border-amber-400",
  "In Progress": "border-blue-500",
  Completed: "border-green-500",
};

export default function TaskKanbanView({
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  tasks: Task[];
  onAdd: (status: Task["status"]) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
}) {
  return (
    <section className="mt-6">
      <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const columnTasks = tasks.filter((task) => task.status === col.status);

          return (
            <div key={col.status} className="min-h-[420px] rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#16161a]">
              <div className={`mb-3 flex items-center justify-between border-l-4 ${columnColors[col.status]} pl-2`}>
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <button
                  type="button"
                  onClick={() => onAdd(col.status)}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
                  aria-label={`Add task in ${col.label}`}
                >
                  <Plus size={14} />
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-500 dark:border-white/10 dark:text-zinc-500">
                      No tasks in this column.
                    </div>
                  ) : null}
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => onEdit(task)}
                      onDelete={() => onDelete(task.id)}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
