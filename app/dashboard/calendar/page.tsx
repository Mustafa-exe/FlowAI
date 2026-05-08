"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, LayoutDashboard, ListTodo, CalendarDays, ChartColumn, Puzzle, Settings2, MessageSquareText } from "lucide-react";
import WeekView from "@/components/calendar/WeekView";
import MonthView from "@/components/calendar/MonthView";
import AgendaView from "@/components/calendar/AgendaView";
import EventDetailPanel from "@/components/calendar/EventDetailPanel";
import { MonthViewSkeleton, WeekViewSkeleton } from "@/components/calendar/CalendarSkeleton";
import ViewSwitcher from "@/components/calendar/ViewSwitcher";
import { calendarEvents } from "@/data/calendarEvents";
import { CalendarEvent, CalendarView } from "@/types/calendar";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

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

const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquareText },
  { label: "Analytics", href: "/dashboard", icon: ChartColumn },
  { label: "Integrations", href: "/dashboard", icon: Puzzle },
  { label: "Settings", href: "/dashboard", icon: Settings2 },
];

export default function CalendarPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";

  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setEvents(calendarEvents);
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [view, currentDate]);

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
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-screen w-20 flex-col border-r px-3 py-5 md:flex lg:w-60 lg:px-4 ${
          isDark ? "border-white/5 bg-[#0d0d0f]" : "border-slate-200 bg-white"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 px-1">
          <span className={`grid size-10 place-items-center rounded-2xl text-sm font-semibold ${isDark ? "bg-[#7c6ff7] text-white" : "bg-[#2563eb] text-white"}`}>
            F
          </span>
          <span className="hidden text-lg font-semibold tracking-[-0.05em] lg:inline">FlowAI</span>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {sidebarLinks.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard/calendar";
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  active
                    ? isDark
                      ? "bg-white/8 text-zinc-100"
                      : "bg-slate-100 text-slate-900"
                    : isDark
                      ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className={`grid size-9 place-items-center rounded-xl ${active ? (isDark ? "bg-[#7c6ff7]/20 text-[#c7bfff]" : "bg-[#2563eb]/10 text-[#2563eb]") : isDark ? "bg-white/5 text-zinc-300" : "bg-slate-100 text-slate-500"}`}>
                  <Icon className="size-4" />
                </span>
                <span className="hidden text-sm font-medium lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-20 lg:pl-60">
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
              <button className="add-task-btn inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white">
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
                  <WeekView currentDate={currentDate} events={events} onSelectEvent={setSelectedEvent} />
                ) : view === "month" ? (
                  <MonthView currentDate={currentDate} events={events} onSelectEvent={setSelectedEvent} />
                ) : (
                  <AgendaView events={events} onSelectEvent={setSelectedEvent} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <EventDetailPanel
        selectedEvent={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onMarkComplete={(id) => setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, completed: true } : ev)))}
        onDelete={(id) => {
          setEvents((prev) => prev.filter((ev) => ev.id !== id));
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}

