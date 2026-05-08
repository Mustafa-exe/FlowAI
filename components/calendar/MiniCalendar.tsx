"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function mondayIndex(day: number) {
  return (day + 6) % 7;
}

function getDaysInMonthGrid(date: Date) {
  const first = startOfMonth(date);
  const last = endOfMonth(date);
  const startPadding = mondayIndex(first.getDay());
  const days: (Date | null)[] = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(date.getFullYear(), date.getMonth(), d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function MiniCalendar({
  value,
  onChange,
}: {
  value: Date;
  onChange: (next: Date) => void;
}) {
  const days = useMemo(() => getDaysInMonthGrid(value), [value]);
  const label = value.toLocaleDateString("en", { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#16161a]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onChange(new Date(value.getFullYear(), value.getMonth() - 1, 1))}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onChange(new Date(value.getFullYear(), value.getMonth() + 1, 1))}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
        {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
          <div key={d} className="grid h-5 place-items-center">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isToday =
            day &&
            day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate();

          return (
            <button
              key={index}
              type="button"
              disabled={!day}
              onClick={() => day && onChange(day)}
              className={`grid h-9 place-items-center rounded-xl text-xs transition ${
                !day
                  ? "opacity-0"
                  : isToday
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {day ? day.getDate() : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

