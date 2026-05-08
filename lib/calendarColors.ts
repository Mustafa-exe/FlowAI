import { CalendarEvent } from "@/types/calendar";

export const eventColors = {
  High: { bg: "bg-red-500/15", border: "border-red-500", text: "text-red-600 dark:text-red-400" },
  Medium: { bg: "bg-amber-500/15", border: "border-amber-500", text: "text-amber-600 dark:text-amber-400" },
  Low: { bg: "bg-green-500/15", border: "border-green-500", text: "text-green-600 dark:text-green-400" },
  meeting: { bg: "bg-blue-500/15", border: "border-blue-500", text: "text-blue-600 dark:text-blue-400" },
  focus: { bg: "bg-violet-500/15", border: "border-violet-500", text: "text-violet-600 dark:text-violet-400" },
} as const;

export const getEventColor = (event: CalendarEvent) => {
  if (event.type === "meeting") return eventColors.meeting;
  if (event.type === "focus") return eventColors.focus;
  return eventColors[event.priority];
};

