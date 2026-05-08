"use client";

import { CalendarView } from "@/types/calendar";

export default function ViewSwitcher({ view, onChange }: { view: CalendarView; onChange: (view: CalendarView) => void }) {
  const items: Array<{ label: string; value: CalendarView }> = [
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Agenda", value: "agenda" },
  ];

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
      {items.map((item) => {
        const active = view === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active ? "bg-[var(--color-accent)] text-white" : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

