"use client";

import { Priority } from "@/types/task";

const styles: Record<Priority, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`${styles[priority]} rounded-full px-2 py-0.5 text-xs font-medium`}>{priority}</span>;
}
