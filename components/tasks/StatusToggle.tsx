"use client";

import { Task } from "@/types/task";

const cycle: Task["status"][] = ["Pending", "In Progress", "Completed"];

const styles: Record<Task["status"], string> = {
  Backlog: "border-zinc-400 text-zinc-500 bg-transparent",
  Pending: "border-amber-400 text-amber-600 bg-transparent",
  "In Progress": "border-blue-500 text-white bg-blue-500",
  Completed: "border-green-500 text-white bg-green-500",
};

export default function StatusToggle({
  id,
  status,
  onChange,
}: {
  id: string;
  status: Task["status"];
  onChange: (id: string, status: Task["status"]) => void;
}) {
  const next = status === "Backlog" ? "Pending" : cycle[(cycle.indexOf(status) + 1) % cycle.length];

  return (
    <button
      type="button"
      onClick={() => onChange(id, next)}
      className={`${styles[status]} border rounded-full px-3 py-1 text-xs font-medium transition-all duration-150`}
      aria-label={`Set ${id} status to ${next}`}
    >
      {status}
    </button>
  );
}
