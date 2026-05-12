"use client";

import { useMemo } from "react";
import { CalendarEvent } from "@/types/calendar";
import EventPill from "./EventPill";

function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysInMonthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = (firstDay.getDay() + 6) % 7; // Monday start
  const days: (Date | null)[] = [];

  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length < 35) days.push(null);

  return days;
}

export default function MonthView({
  currentDate,
  events,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const days = useMemo(() => getDaysInMonthGrid(currentDate), [currentDate]);
  const today = new Date();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-white/85 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 backdrop-blur dark:border-white/10 dark:bg-[#111114]/85 dark:text-zinc-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-1 sm:px-3 py-2 sm:py-3">
            <span className="hidden sm:inline">{d}</span>
            <span className="inline sm:hidden text-[10px]">{d.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 overflow-auto">
        {days.map((day, index) => {
          if (!day) {
            return (
              <div key={index} className="min-h-[80px] sm:min-h-[110px] border-b border-r border-slate-200/70 dark:border-white/10" />
            );
          }

          const isToday =
            day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate();

          const iso = toISODate(day);
          const dayEvents = events.filter((event) => event.date === iso);

          return (
            <div
              key={iso}
              className={`min-h-[80px] sm:min-h-[110px] border-b border-r border-slate-200/70 p-1 sm:p-2 dark:border-white/10 overflow-y-auto ${
                isToday ? "bg-[var(--color-accent)]/5" : ""
              }`}
            >
              <span
                className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-medium ${
                  isToday ? "bg-[var(--color-accent)] text-white" : "text-slate-900 dark:text-zinc-100"
                }`}
              >
                {day.getDate()}
              </span>

              <div className="mt-0.5 sm:mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => (
                  <EventPill key={event.id} event={event} onClick={() => onSelectEvent(event)} />
                ))}
                {dayEvents.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => onSelectEvent(dayEvents[0])}
                    className="pl-1 text-xs text-slate-500 dark:text-zinc-500 hover:underline"
                  >
                    +{dayEvents.length - 2} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

