"use client";

import { motion } from "framer-motion";
import { CalendarEvent } from "@/types/calendar";
import { getEventColor } from "@/lib/calendarColors";

export default function EventBlock({
  event,
  style,
  onClick,
}: {
  event: CalendarEvent;
  style: { top: string; height: string };
  onClick: () => void;
}) {
  const color = getEventColor(event);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute left-2 right-2 rounded-lg border-l-4 px-3 py-2 text-left shadow-sm ${color.bg} ${color.border} ${
        event.completed ? "opacity-60" : ""
      }`}
      style={style}
    >
      <p className="truncate text-xs font-semibold">{event.title}</p>
      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-400">
        {event.startTime} – {event.endTime}
      </p>
    </motion.button>
  );
}

