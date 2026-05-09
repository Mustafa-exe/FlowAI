"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, Target, TrendingUp, Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  subscribeToTasks,
  subscribeToAnalytics,
  subscribeToEvents,
  DEFAULT_ANALYTICS,
  type AnalyticsDoc,
} from "@/lib/firestoreCollections";
import type { Task } from "@/types/task";
import type { CalendarEvent } from "@/types/calendar";
import SkeletonRow from "@/components/ui/SkeletonRow";
import { DashboardSidebar } from "@/components/DashboardSidebar";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeeklyBarChart({ data, isDark }: { data: number[]; isDark: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 560;
  const H = 220;   // taller to give tooltip room above bars
  const PAD_L = 32;
  const PAD_R = 16;
  const PAD_T = 40; // extra top padding so tooltip never clips
  const PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...data, 1);
  const barCount = data.length;
  const gap = 8;
  const barW = (chartW - gap * (barCount - 1)) / barCount;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: PAD_T + chartH * (1 - pct),
    label: Math.round(maxVal * pct),
  }));

  const accentColor = isDark ? "#7c6ff7" : "#2563eb";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "#71717a" : "#94a3b8";
  const tooltipBg = isDark ? "#1c1c21" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const tooltipText = isDark ? "#f4f4f5" : "#0f172a";

  return (
    <div className="mt-4 w-full overflow-visible">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height: "220px" }}
        aria-label="Weekly task activity bar chart"
      >
        {/* Grid lines */}
        {gridLines.map(({ y, label }) => (
          <g key={y}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={gridColor} strokeWidth={1} />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10} fill={labelColor}>
              {label > 0 ? label : ""}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((value, idx) => {
          const x = PAD_L + idx * (barW + gap);
          const barH = value > 0 ? Math.max(4, (value / maxVal) * chartH) : 3;
          const y = PAD_T + chartH - barH;
          const isHov = hovered === idx;
          const fill = value > 0
            ? isHov ? accentColor : `${accentColor}cc`
            : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

          return (
            <g key={idx}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: value > 0 ? "pointer" : "default" }}
            >
              {/* Bar */}
              <rect
                x={x} y={y}
                width={barW} height={barH}
                rx={4} ry={4}
                fill={fill}
                style={{ transition: "fill 0.15s, height 0.4s, y 0.4s" }}
              />

              {/* Tooltip on hover */}
              {isHov && value > 0 && (
                <g>
                  {/* Position tooltip above bar, but clamp so it stays inside viewBox */}
                  <rect
                    x={x + barW / 2 - 28} y={Math.max(4, y - 32)}
                    width={56} height={24}
                    rx={6} ry={6}
                    fill={tooltipBg}
                    stroke={tooltipBorder}
                    strokeWidth={1}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                  />
                  <text
                    x={x + barW / 2} y={Math.max(4, y - 32) + 15}
                    textAnchor="middle" fontSize={11}
                    fontWeight="600" fill={tooltipText}
                  >
                    {value} task{value !== 1 ? "s" : ""}
                  </text>
                </g>
              )}

              {/* Day label */}
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={11}
                fill={isHov ? accentColor : labelColor}
                fontWeight={isHov ? "600" : "400"}
                style={{ transition: "fill 0.15s" }}
              >
                {DAYS[idx].slice(0, 1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const { theme } = useThemeMode();
  const { user, isAuthReady } = useAuth();
  const isDark = theme === "dark";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [storedAnalytics, setStoredAnalytics] = useState<AnalyticsDoc>(DEFAULT_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) { setIsLoading(false); return; }

    let tasksReady = false;
    let analyticsReady = false;
    let eventsReady = false;
    const checkDone = () => {
      if (tasksReady && analyticsReady && eventsReady) setIsLoading(false);
    };

    const unsubTasks = subscribeToTasks(user.uid, (data) => {
      setTasks(data); tasksReady = true; checkDone();
    });
    const unsubAnalytics = subscribeToAnalytics(user.uid, (data) => {
      // If the doc has the old hardcoded seed values, reset it to real defaults
      const hasOldSeedData = data.avgFocusMinutes === 222 || data.weeklyGoal === 420 || data.tasksCompleted === 184;
      if (hasOldSeedData) {
        // Overwrite stale seeded data with real zeros
        import("@/lib/firestoreCollections").then(({ updateAnalytics }) => {
          updateAnalytics(user.uid, {
            productivityScore: 0,
            tasksCompleted: 0,
            avgFocusMinutes: 0,
            weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
            weeklyGoal: 10,
          }).catch(() => {});
        });
        setStoredAnalytics({ ...DEFAULT_ANALYTICS, weeklyGoal: 10 });
      } else {
        setStoredAnalytics(data);
      }
      analyticsReady = true;
      checkDone();
    });
    const unsubEvents = subscribeToEvents(user.uid, (data) => {
      setCalEvents(data); eventsReady = true; checkDone();
    });

    return () => { unsubTasks(); unsubAnalytics(); unsubEvents(); };
  }, [isAuthReady, user]);

  // ── Derive analytics from real data ──────────────────────────────────────
  const analytics = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const total = tasks.length;
    const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Weekly activity: distribute tasks across Mon–Sun by dueDate
    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    const todayJs = new Date().getDay(); // 0=Sun
    const todayMon = (todayJs + 6) % 7;  // 0=Mon

    // Map keyword → Mon-indexed day
    const dayKeywords: [string, number][] = [
      ["monday",    0], ["mon", 0],
      ["tuesday",   1], ["tue", 1],
      ["wednesday", 2], ["wed", 2],
      ["thursday",  3], ["thu", 3],
      ["friday",    4], ["fri", 4],
      ["saturday",  5], ["sat", 5],
      ["sunday",    6], ["sun", 6],
    ];

    tasks.forEach((t) => {
      const due = t.dueDate.toLowerCase();

      // ISO datetime format: "2026-05-22T23:03" — parse the date directly
      if (/^\d{4}-\d{2}-\d{2}/.test(t.dueDate)) {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) {
          weeklyActivity[(d.getDay() + 6) % 7]++; // convert JS Sun=0 to Mon=0
          return;
        }
      }

      // Human-readable fallback: "Today", "Tomorrow", "Wed, 5:00 PM", etc.
      if (due.includes("today")) {
        weeklyActivity[todayMon]++;
      } else if (due.includes("tomorrow")) {
        weeklyActivity[(todayMon + 1) % 7]++;
      } else {
        for (const [kw, idx] of dayKeywords) {
          if (due.includes(kw)) {
            weeklyActivity[idx]++;
            break;
          }
        }
      }
    });

    // Avg focus time: sum duration of focus-type calendar events (in minutes)
    const focusEvents = calEvents.filter((e) => e.type === "focus");
    let totalFocusMinutes = 0;
    focusEvents.forEach((e) => {
      const [sh, sm] = e.startTime.split(":").map(Number);
      const [eh, em] = e.endTime.split(":").map(Number);
      totalFocusMinutes += (eh * 60 + em) - (sh * 60 + sm);
    });
    const avgFocusMinutes = focusEvents.length > 0
      ? Math.round(totalFocusMinutes / focusEvents.length)
      : 0;

    return {
      productivityScore,
      tasksCompleted: completed,
      avgFocusMinutes,
      weeklyActivity,
      // Use stored weeklyGoal only if it's a real user-set value (not the old 420 seed)
      weeklyGoal: storedAnalytics.weeklyGoal === 420 ? 10 : (storedAnalytics.weeklyGoal || 10),
    };
  }, [tasks, calEvents, storedAnalytics.weeklyGoal]);

  const stats = useMemo(() => [
    {
      label: "Productivity Score",
      value: `${analytics.productivityScore}%`,
      trend: analytics.productivityScore > 0 ? `${analytics.tasksCompleted} tasks done` : "No tasks yet",
      icon: TrendingUp,
    },
    {
      label: "Tasks Completed",
      value: `${analytics.tasksCompleted}`,
      trend: `of ${tasks.length} total`,
      icon: Zap,
    },
    {
      label: "Avg Focus Time",
      value: analytics.avgFocusMinutes > 0
        ? `${Math.floor(analytics.avgFocusMinutes / 60)}h ${analytics.avgFocusMinutes % 60}m`
        : "—",
      trend: "Tracked sessions",
      icon: CalendarDays,
    },
  ], [analytics, tasks.length]);

  const weeklyTotal = analytics.weeklyActivity.reduce((s, v) => s + v, 0);
  const weeklyProgress = analytics.weeklyGoal > 0
    ? Math.min(100, Math.round((analytics.tasksCompleted / analytics.weeklyGoal) * 100))
    : 0;

  return (
    <div className={isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"}>
      <DashboardSidebar />

      <div className="md:pl-[72px] lg:pl-60">
        {/* Top bar */}
        <div className={`sticky top-0 z-20 border-b ${isDark ? "border-white/10 bg-[#111114]/85" : "border-slate-200 bg-white/85"} backdrop-blur`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>Analytics</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Performance Overview</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`rounded-2xl border p-5 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"}`}>
                    <SkeletonRow />
                  </div>
                ))
              : stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <motion.article
                      key={stat.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border p-5 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>{stat.label}</p>
                          <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">{stat.value}</p>
                        </div>
                        <span className={`grid size-11 place-items-center rounded-2xl ${isDark ? "bg-white/5 text-[var(--color-accent)]" : "bg-slate-100 text-[var(--color-accent)]"}`}>
                          <Icon className="size-5" />
                        </span>
                      </div>
                      <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? "text-zinc-500" : "text-slate-400"}`}>{stat.trend}</p>
                    </motion.article>
                  );
                })}
          </div>

          <section className="mt-6 grid gap-4 lg:grid-cols-[1.8fr_1fr]">
            {/* Weekly activity — SVG bar chart */}
            <div className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"}`}>
              <h2 className="text-lg font-semibold">Weekly Activity</h2>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Tasks by day of week</p>
              {isLoading ? (
                <div className="mt-6 space-y-3">
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : (
                <WeeklyBarChart data={analytics.weeklyActivity} isDark={isDark} />
              )}
            </div>

            {/* Weekly goal */}
            <div className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"}`}>
              <h2 className="text-lg font-semibold">This Week Goal</h2>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Progress against your weekly target</p>
              {isLoading ? (
                <div className="mt-6">
                  <SkeletonRow />
                </div>
              ) : (
                <>
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                        {analytics.tasksCompleted} / {analytics.weeklyGoal} completed
                      </span>
                      <span className="text-sm font-semibold text-[var(--color-accent)]">{weeklyProgress}%</span>
                    </div>
                    <div className={`h-2 w-full rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                      <div
                        className="h-2 rounded-full bg-[var(--color-accent)] transition-all duration-500"
                        style={{ width: `${weeklyProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className={`mt-6 rounded-xl border p-4 ${isDark ? "border-white/10 bg-[#111114]" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`grid size-9 place-items-center rounded-xl ${isDark ? "bg-white/5 text-[var(--color-accent)]" : "bg-slate-100 text-[var(--color-accent)]"}`}>
                        <Target className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">Goal health</p>
                        <p className={`text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                          {tasks.length === 0
                            ? "Add tasks to start tracking"
                            : weeklyProgress >= 85
                              ? "On track for completion"
                              : weeklyProgress >= 50
                                ? "Making progress — keep going"
                                : "Focus sessions needed to recover pace"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Task breakdown */}
                  <div className="mt-4 space-y-2">
                    {[
                      { label: "Completed", count: tasks.filter((t) => t.status === "Completed").length, color: "bg-emerald-500" },
                      { label: "In Progress", count: tasks.filter((t) => t.status === "In Progress").length, color: "bg-blue-500" },
                      { label: "Pending", count: tasks.filter((t) => t.status === "Pending").length, color: "bg-amber-500" },
                      { label: "Backlog", count: tasks.filter((t) => t.status === "Backlog").length, color: "bg-slate-400" },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${color}`} />
                          <span className={isDark ? "text-zinc-400" : "text-slate-600"}>{label}</span>
                        </div>
                        <span className={`font-semibold ${isDark ? "text-zinc-300" : "text-slate-700"}`}>{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
