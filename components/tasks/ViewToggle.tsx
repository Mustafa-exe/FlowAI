"use client";

import { Columns, List } from "lucide-react";

export default function ViewToggle({
  view,
  onChange,
}: {
  view: "list" | "kanban";
  onChange: (view: "list" | "kanban") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
          view === "list"
            ? "bg-[#2563eb] text-white dark:bg-[#7c6ff7]"
            : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
        aria-pressed={view === "list"}
      >
        <List size={15} />
        List
      </button>
      <button
        type="button"
        onClick={() => onChange("kanban")}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
          view === "kanban"
            ? "bg-[#2563eb] text-white dark:bg-[#7c6ff7]"
            : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
        aria-pressed={view === "kanban"}
      >
        <Columns size={15} />
        Kanban
      </button>
    </div>
  );
}
