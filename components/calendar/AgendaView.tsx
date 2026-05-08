"use client";

import { motion } from "framer-motion";
import { CalendarEvent } from "@/types/calendar";
import { getEventColor } from "@/lib/calendarColors";

function groupByDate(events: CalendarEvent[]) {
  return events.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);
}

function formatAgendaDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });
}

export default function AgendaView({
  events,
  onSelectEvent,
}: {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const grouped = groupByDate([...events].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)));

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        {Object.entries(grouped).map(([date, dayEvents]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-sm font-semibold">{formatAgendaDate(date)}</h3>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              {dayEvents.map((event) => {
                const color = getEventColor(event);
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                      event.completed ? "opacity-60" : ""
                    } border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#16161a] dark:hover:bg-white/5`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{event.title}</p>
                      {event.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-zinc-400">{event.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
                        {event.startTime} – {event.endTime}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${color.bg} ${color.border} ${color.text}`}>
                      {event.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

