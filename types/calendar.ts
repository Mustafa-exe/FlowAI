export type EventType = "task" | "meeting" | "focus" | "deadline";
export type Priority = "High" | "Medium" | "Low";
export type CalendarView = "week" | "month" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: EventType;
  priority: Priority;
  completed: boolean;
}

