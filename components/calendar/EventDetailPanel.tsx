"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock, Tag, X } from "lucide-react";
import { CalendarEvent } from "@/types/calendar";
import { getEventColor } from "@/lib/calendarColors";
import PriorityBadge from "@/components/tasks/PriorityBadge";

function formatDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });
}

function DetailRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-500 dark:text-zinc-400">{icon}</span>
      <span className="text-slate-700 dark:text-zinc-200">{label}</span>
    </div>
  );
}

export default function EventDetailPanel({
  selectedEvent,
  onClose,
  onMarkComplete,
  onDelete,
}: {
  selectedEvent: CalendarEvent | null;
  onClose: () => void;
  onMarkComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {selectedEvent ? (
        <>
          {/* Mobile backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          />
          {/* Panel - fixed on desktop, modal overlay on mobile */}
          <motion.div
            initial={{ x: "100%", opacity: 0, y: "100%" }}
            animate={{ x: 0, opacity: 1, y: 0 }}
            exit={{ x: "100%", opacity: 0, y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-30 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111114] lg:right-0 lg:bottom-auto lg:left-auto lg:top-0 lg:max-h-full lg:w-[360px] lg:rounded-t-none lg:border-l lg:border-t-0"
          >
          <div className={`border-b border-slate-200 p-6 dark:border-white/10 ${getEventColor(selectedEvent).bg}`}>
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 hover:bg-white/60 dark:text-zinc-400 dark:hover:bg-white/10"
                aria-label="Close event panel"
              >
                <X size={18} />
              </button>
              <button type="button" className="text-xs font-medium text-[var(--color-accent)]">
                Edit
              </button>
            </div>

            <div className={`flex items-center border-l-4 pl-3 ${getEventColor(selectedEvent).border}`}>
              <h2 className="text-lg font-semibold">{selectedEvent.title}</h2>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <DetailRow icon={<CalendarDays size={16} />} label={formatDate(selectedEvent.date)} />
            <DetailRow icon={<Clock size={16} />} label={`${selectedEvent.startTime} – ${selectedEvent.endTime}`} />
            <DetailRow icon={<Tag size={16} />} label={selectedEvent.type} />
            <div>
              <PriorityBadge priority={selectedEvent.priority} />
            </div>

            {selectedEvent.description ? (
              <div className="pt-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Description</p>
                <p className="text-sm text-slate-700 dark:text-zinc-200">{selectedEvent.description}</p>
              </div>
            ) : null}

            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={() => onMarkComplete(selectedEvent.id)}
                className="w-full rounded-lg bg-[var(--color-accent)] py-2 text-sm font-medium text-white"
              >
                {selectedEvent.completed ? "Completed" : "Mark Complete"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(selectedEvent.id)}
                className="w-full rounded-lg border border-rose-500/30 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/5"
              >
                Delete Event
              </button>
            </div>
          </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

