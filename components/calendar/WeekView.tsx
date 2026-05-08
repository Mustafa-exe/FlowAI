"use client";

import { CalendarEvent } from "@/types/calendar";
import CurrentTimeLine from "./CurrentTimeLine";
import EventBlock from "./EventBlock";

const HOUR_HEIGHT = 60;
const START_HOUR = 8;
const END_HOUR = 20;

function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday start
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatHour(hour: number) {
  const h = hour % 12 || 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h} ${suffix}`;
}

function getEventStyle(event: CalendarEvent) {
  const [startH, startM] = event.startTime.split(":").map(Number);
  const [endH, endM] = event.endTime.split(":").map(Number);
  const top = ((startH - START_HOUR) + startM / 60) * HOUR_HEIGHT;
  const height = ((endH - startH) + (endM - startM) / 60) * HOUR_HEIGHT;
  return { top: `${top}px`, height: `${Math.max(28, height)}px` };
}

export default function WeekView({
  currentDate,
  events,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const start = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => START_HOUR + i);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-10 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-[#111114]/85">
        <div className="h-12" />
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="flex h-12 items-center justify-center border-l border-slate-200 dark:border-white/10">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">
                {day.toLocaleDateString("en", { weekday: "short" })}
              </p>
              <p className="text-sm font-semibold">{day.getDate()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-auto">
        <div className="sticky left-0 z-10 w-16 shrink-0 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-[#111114]">
          {hours.map((hour) => (
            <div key={hour} className="flex h-[60px] items-start justify-end pr-3 pt-1 text-xs text-slate-500 dark:text-zinc-500">
              {formatHour(hour)}
            </div>
          ))}
        </div>

        <div className="relative grid flex-1 grid-cols-7">
          {weekDays.map((day) => {
            const dayISO = toISODate(day);
            const dayEvents = events.filter((event) => event.date === dayISO);

            return (
              <div key={dayISO} className="relative border-r border-slate-200 dark:border-white/10">
                {hours.map((hour) => (
                  <div key={hour} className="h-[60px] border-b border-slate-200/60 dark:border-white/5" />
                ))}
                {dayEvents.map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    style={getEventStyle(event)}
                    onClick={() => onSelectEvent(event)}
                  />
                ))}
              </div>
            );
          })}

          <div className="pointer-events-none absolute left-0 top-0 right-0">
            <CurrentTimeLine startHour={START_HOUR} hourHeight={HOUR_HEIGHT} />
          </div>
        </div>
      </div>
    </div>
  );
}

