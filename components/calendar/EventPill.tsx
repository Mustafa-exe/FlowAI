"use client";

import { CalendarEvent } from "@/types/calendar";
import { getEventColor } from "@/lib/calendarColors";

export default function EventPill({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const color = getEventColor(event);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full truncate rounded-md border-l-4 px-2 py-1 text-left text-[11px] font-medium ${color.bg} ${color.border}`}
      title={event.title}
    >
      {event.title}
    </button>
  );
}

