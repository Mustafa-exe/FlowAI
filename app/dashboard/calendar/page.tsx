"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Sparkles, X } from "lucide-react";
import WeekView from "@/components/calendar/WeekView";
import MonthView from "@/components/calendar/MonthView";
import AgendaView from "@/components/calendar/AgendaView";
import EventDetailPanel from "@/components/calendar/EventDetailPanel";
import { MonthViewSkeleton, WeekViewSkeleton } from "@/components/calendar/CalendarSkeleton";
import ViewSwitcher from "@/components/calendar/ViewSwitcher";
import { CalendarEvent, CalendarView } from "@/types/calendar";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { subscribeToEvents, subscribeToTasks, addEvent, updateEvent, deleteEvent, clearSeedEvents } from "@/lib/firestoreCollections";
import type { Task } from "@/types/task";
import { DashboardSidebar } from "@/components/DashboardSidebar";

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPeriodLabel(view: CalendarView, currentDate: Date) {
  if (view === "week") {
    const start = getWeekStart(currentDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }
  return currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });
}

export default function CalendarPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const { user, isAuthReady } = useAuth();

  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "10:00",
    type: "meeting" as CalendarEvent["type"],
    description: "",
  });

  // ── AI Schedule state ─────────────────────────────────────────────────────
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [scheduleError, setScheduleError] = useState("");

  const handleGenerateSchedule = async () => {
    if (!user) return;
    setScheduleLoading(true);
    setScheduleError("");
    setScheduleData(null);
    setScheduleOpen(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          // Pass tasks from client so the server doesn't need Firestore access
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            dueDate: t.dueDate,
            priority: t.priority,
            status: t.status,
          })),
          workingHours: {
            start: "08:00",
            end: "18:00",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Schedule generation failed");
      setScheduleData(data);
    } catch (err: any) {
      setScheduleError(err.message ?? "Something went wrong");
    } finally {
      setScheduleLoading(false);
    }
  };

  // Subscribe to Firestore events + tasks
  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) { setIsLoading(false); return; }

    // Clear any old demo seed events silently
    clearSeedEvents(user.uid).catch(() => {});

    let eventsReady = false;
    let tasksReady = false;
    const checkDone = () => { if (eventsReady && tasksReady) setIsLoading(false); };

    const unsubEvents = subscribeToEvents(user.uid, (data) => {
      setCalendarEvents(data);
      eventsReady = true;
      checkDone();
    });

    const unsubTasks = subscribeToTasks(user.uid, (data) => {
      setTasks(data);
      tasksReady = true;
      checkDone();

      // Auto-navigate to the week containing the nearest upcoming task
      const upcoming = data
        .filter((t) => /^\d{4}-\d{2}-\d{2}/.test(t.dueDate))
        .map((t) => new Date(t.dueDate))
        .filter((d) => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      if (upcoming.length > 0) {
        const nearest = upcoming[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Only jump if the nearest task is not in the current week
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (nearest < weekStart || nearest > weekEnd) {
          setCurrentDate(nearest);
        }
      }
    });

    return () => { unsubEvents(); unsubTasks(); };
  }, [isAuthReady, user]);

  // Convert tasks with ISO dueDates into CalendarEvent objects
  const taskEvents = useMemo<CalendarEvent[]>(() => {
    return tasks
      .filter((t) => /^\d{4}-\d{2}-\d{2}/.test(t.dueDate)) // only tasks with real dates
      .map((t) => {
        const dt = new Date(t.dueDate);
        const date = dt.toISOString().slice(0, 10);
        const hh = String(dt.getHours()).padStart(2, "0");
        const mm = String(dt.getMinutes()).padStart(2, "0");
        const startTime = `${hh}:${mm}`;
        // Default 1-hour duration
        const endDt = new Date(dt.getTime() + 60 * 60 * 1000);
        const endTime = `${String(endDt.getHours()).padStart(2, "0")}:${String(endDt.getMinutes()).padStart(2, "0")}`;
        return {
          id: `task-${t.id}`,
          title: t.title,
          description: t.description,
          date,
          startTime,
          endTime,
          type: "task" as const,
          priority: t.priority,
          completed: t.status === "Completed",
        };
      });
  }, [tasks]);

  // Merge task-derived events with user-created calendar events
  const allEvents = useMemo<CalendarEvent[]>(() => {
    // Deduplicate: user-created events take precedence over task-derived ones
    const taskEventIds = new Set(taskEvents.map((e) => e.id));
    const userEvents = calendarEvents.filter((e) => !taskEventIds.has(e.id));
    return [...taskEvents, ...userEvents];
  }, [taskEvents, calendarEvents]);

  const navigate = (direction: "prev" | "next") => {
    const d = new Date(currentDate);
    if (view === "week") d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
    if (view === "month") d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    if (view === "agenda") d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(d);
  };

  const periodLabel = useMemo(() => getPeriodLabel(view, currentDate), [currentDate, view]);

  return (
    <div className={isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"}>
      <DashboardSidebar />

      <div className="md:pl-[72px] lg:pl-60">
        <div className={`sticky top-0 z-20 border-b ${isDark ? "border-white/10 bg-[#111114]/85" : "border-slate-200 bg-white/85"} backdrop-blur`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("prev")}
                className={`rounded-full p-2 ${isDark ? "text-zinc-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>Calendar</p>
                <h1 className="mt-1 text-lg font-semibold tracking-[-0.03em]">{periodLabel}</h1>
              </div>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className={`ml-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  isDark ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => navigate("next")}
                className={`rounded-full p-2 ${isDark ? "text-zinc-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ViewSwitcher view={view} onChange={setView} />
              <button
                onClick={handleGenerateSchedule}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-white"
              >
                <Sparkles size={14} />
                AI Schedule
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                className="add-task-btn inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white">
                <Plus size={16} />
                Add Event
              </button>
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl gap-4 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-[#111114]">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col overflow-hidden"
              >
                {isLoading ? (
                  view === "week" ? (
                    <WeekViewSkeleton />
                  ) : view === "month" ? (
                    <MonthViewSkeleton />
                  ) : (
                    <MonthViewSkeleton />
                  )
                ) : view === "week" ? (
                  <WeekView currentDate={currentDate} events={allEvents} onSelectEvent={setSelectedEvent} />
                ) : view === "month" ? (
                  <MonthView currentDate={currentDate} events={allEvents} onSelectEvent={setSelectedEvent} />
                ) : (
                  <AgendaView events={allEvents} onSelectEvent={setSelectedEvent} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <EventDetailPanel
        selectedEvent={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onMarkComplete={async (id) => {
          if (!user) return;
          // task-derived events: don't write to calendarEvents collection
          if (!id.startsWith("task-")) {
            await updateEvent(user.uid, id, { completed: true });
          }
        }}
        onDelete={async (id) => {
          if (!user) return;
          if (!id.startsWith("task-")) {
            await deleteEvent(user.uid, id);
          }
          setSelectedEvent(null);
        }}
      />

      {/* AI Schedule Panel */}
      <AnimatePresence>
        {scheduleOpen && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setScheduleOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[var(--color-accent)]" />
                  <h3 className="text-lg font-semibold">AI Daily Schedule</h3>
                </div>
                <button type="button" onClick={() => setScheduleOpen(false)}
                  className={`rounded-full p-1.5 ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
                  <X className="size-4" />
                </button>
              </div>

              {scheduleLoading && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                  <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Generating your optimized schedule…</p>
                </div>
              )}

              {scheduleError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-sm text-red-500">{scheduleError}</p>
                </div>
              )}

              {scheduleData && !scheduleLoading && (
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-600"}`}>{scheduleData.summary}</p>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                    {scheduleData.scheduled_tasks} of {scheduleData.total_tasks} tasks scheduled
                  </p>
                  <div className="space-y-2">
                    {scheduleData.schedule?.map((block: any, i: number) => (
                      <div key={i} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${
                        isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                      }`}>
                        <span className={`mt-0.5 shrink-0 text-xs font-mono font-semibold ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                          {block.start_time}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{block.title}</p>
                          {block.description && (
                            <p className={`text-xs truncate ${isDark ? "text-zinc-500" : "text-slate-400"}`}>{block.description}</p>
                          )}
                        </div>
                        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          block.type === "break" || block.type === "buffer"
                            ? isDark ? "bg-zinc-700 text-zinc-400" : "bg-slate-100 text-slate-500"
                            : block.priority === "High"
                              ? "bg-rose-500/10 text-rose-500"
                              : block.priority === "Medium"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {block.type === "break" || block.type === "buffer" ? block.type : (block.priority ?? block.type)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSchedule}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition"
                  >
                    <Sparkles size={14} /> Regenerate
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAddModalOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`w-full max-w-[440px] rounded-2xl border p-6 shadow-2xl ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"}`}
              onClick={(e) => e.stopPropagation()}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user || !newEvent.title.trim()) return;
                await addEvent(user.uid, {
                  title: newEvent.title.trim(),
                  description: newEvent.description,
                  date: newEvent.date,
                  startTime: newEvent.startTime,
                  endTime: newEvent.endTime,
                  type: newEvent.type,
                  priority: "Medium",
                  completed: false,
                });
                setAddModalOpen(false);
                setNewEvent({ title: "", date: new Date().toISOString().slice(0, 10), startTime: "09:00", endTime: "10:00", type: "meeting", description: "" });
              }}
            >
              <h3 className="text-lg font-semibold">Add Event</h3>
              <div className="mt-4 space-y-3">
                <input
                  autoFocus required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Event title"
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
                />
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Date</label>
                    <input type="date" required value={newEvent.date}
                      onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Type</label>
                    <select value={newEvent.type}
                      onChange={(e) => setNewEvent((p) => ({ ...p, type: e.target.value as CalendarEvent["type"] }))}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
                    >
                      <option value="meeting">Meeting</option>
                      <option value="task">Task</option>
                      <option value="focus">Focus Block</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Start</label>
                    <input type="time" required value={newEvent.startTime}
                      onChange={(e) => setNewEvent((p) => ({ ...p, startTime: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>End</label>
                    <input type="time" required value={newEvent.endTime}
                      onChange={(e) => setNewEvent((p) => ({ ...p, endTime: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setAddModalOpen(false)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${isDark ? "border-white/10 bg-white/5 text-zinc-100" : "border-slate-200 bg-white text-slate-700"}`}>
                  Cancel
                </button>
                <button type="submit"
                  className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white">
                  Add Event
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
