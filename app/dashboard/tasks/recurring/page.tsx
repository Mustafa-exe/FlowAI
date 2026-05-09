"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, RefreshCw, Trash2, RepeatIcon } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useThemeMode } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { processRecurringRules, type RecurringRule } from "@/lib/recurringTasks";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "Medium" as RecurringRule["priority"],
  frequency: "daily" as RecurringRule["frequency"],
  dayOfWeek: 1,
  dayOfMonth: 1,
  time: "09:00",
};

export default function RecurringTasksPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const { user, isAuthReady } = useAuth();

  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch rules from API
  const fetchRules = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/tasks/recurring", {
        headers: { "x-user-uid": user.uid },
      });
      const data = await res.json();
      setRules(data.rules ?? []);
    } catch {
      setError("Failed to load recurring rules.");
    } finally {
      setIsLoading(false);
    }
  };

  // On mount: process due rules and fetch list
  useEffect(() => {
    if (!isAuthReady || !user) return;

    processRecurringRules(user.uid)
      .then((count) => {
        if (count > 0) setGeneratedCount(count);
      })
      .catch(() => {});

    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`/api/tasks/recurring?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-uid": user.uid },
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete rule.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        frequency: form.frequency,
        time: form.time,
        active: true,
      };
      if (form.frequency === "weekly") body.dayOfWeek = form.dayOfWeek;
      if (form.frequency === "monthly") body.dayOfMonth = form.dayOfMonth;

      const res = await fetch("/api/tasks/recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-uid": user.uid,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create rule.");
      }

      const data = await res.json();
      setRules((prev) => [...prev, data.rule]);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message ?? "Failed to create rule.");
    } finally {
      setSaving(false);
    }
  };

  const priorityColor = (p: string) => {
    if (p === "High") return isDark ? "text-rose-400" : "text-rose-600";
    if (p === "Medium") return isDark ? "text-amber-400" : "text-amber-600";
    return isDark ? "text-emerald-400" : "text-emerald-600";
  };

  const cardClass = isDark
    ? "border-white/10 bg-[#121219]"
    : "border-slate-200 bg-white";

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
    isDark
      ? "border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 focus:border-[var(--color-accent)]"
      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-accent)]"
  }`;

  return (
    <div className={isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"}>
      <DashboardSidebar />

      <div className="md:pl-[72px] lg:pl-60">
        <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className={`grid size-9 place-items-center rounded-xl ${isDark ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"}`}>
                <RepeatIcon size={18} />
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-[-0.03em]">Recurring Tasks</h1>
                <p className={`text-xs ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                  Automate task creation on a schedule
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Plus size={16} />
              New Rule
            </button>
          </div>

          {/* Generated tasks banner */}
          <AnimatePresence>
            {generatedCount !== null && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-500/20 bg-emerald-50 text-emerald-700"
                }`}
              >
                <RefreshCw size={15} className="shrink-0" />
                <span>
                  Generated {generatedCount} recurring task{generatedCount === 1 ? "" : "s"} for today.
                </span>
                <button
                  type="button"
                  onClick={() => setGeneratedCount(null)}
                  className="ml-auto opacity-60 hover:opacity-100"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-rose-500/20 bg-rose-50 text-rose-700"
                }`}
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-auto opacity-60 hover:opacity-100"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Rule Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={`mb-6 rounded-2xl border p-5 ${cardClass}`}
              >
                <h2 className="mb-4 text-base font-semibold">New Recurring Rule</h2>
                <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Daily standup notes"
                      className={inputClass}
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional description"
                      className={inputClass}
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as RecurringRule["priority"] }))}
                      className={inputClass}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                      Frequency
                    </label>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as RecurringRule["frequency"] }))}
                      className={inputClass}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Day of week (weekly only) */}
                  {form.frequency === "weekly" && (
                    <div>
                      <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                        Day of Week
                      </label>
                      <select
                        value={form.dayOfWeek}
                        onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                        className={inputClass}
                      >
                        {DAYS.map((d, i) => (
                          <option key={d} value={i}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Day of month (monthly only) */}
                  {form.frequency === "monthly" && (
                    <div>
                      <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                        Day of Month
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={form.dayOfMonth}
                        onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: Number(e.target.value) }))}
                        className={inputClass}
                      />
                    </div>
                  )}

                  {/* Time */}
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                      Time
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      className={inputClass}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Create Rule"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
                      className={`rounded-lg border px-5 py-2 text-sm font-medium transition ${
                        isDark
                          ? "border-white/10 text-zinc-400 hover:bg-white/5"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rules list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-20 animate-pulse rounded-2xl border ${cardClass}`}
                />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className={`flex flex-col items-center justify-center rounded-2xl border py-16 text-center ${cardClass}`}>
              <RepeatIcon size={32} className={isDark ? "text-zinc-600" : "text-slate-300"} />
              <p className={`mt-3 text-sm font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                No recurring rules yet
              </p>
              <p className={`mt-1 text-xs ${isDark ? "text-zinc-600" : "text-slate-400"}`}>
                Create a rule to automatically generate tasks on a schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {rules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${cardClass}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold">{rule.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isDark ? "bg-white/5 text-zinc-400" : "bg-slate-100 text-slate-500"
                        }`}>
                          {rule.frequency}
                        </span>
                        <span className={`text-xs font-medium ${priorityColor(rule.priority)}`}>
                          {rule.priority}
                        </span>
                        {!rule.active && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            isDark ? "bg-zinc-800 text-zinc-500" : "bg-slate-100 text-slate-400"
                          }`}>
                            Inactive
                          </span>
                        )}
                      </div>
                      {rule.description && (
                        <p className={`mt-1 truncate text-xs ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                          {rule.description}
                        </p>
                      )}
                      <p className={`mt-1 text-xs ${isDark ? "text-zinc-600" : "text-slate-400"}`}>
                        {rule.frequency === "weekly" && rule.dayOfWeek !== undefined
                          ? `Every ${DAYS[rule.dayOfWeek]}`
                          : rule.frequency === "monthly" && rule.dayOfMonth !== undefined
                          ? `Every month on day ${rule.dayOfMonth}`
                          : "Every day"}{" "}
                        at {rule.time}
                        {rule.lastGenerated && ` · Last generated ${rule.lastGenerated}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => rule.id && handleDelete(rule.id)}
                      className={`shrink-0 rounded-lg p-2 transition ${
                        isDark
                          ? "text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                          : "text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                      }`}
                      aria-label={`Delete rule: ${rule.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
