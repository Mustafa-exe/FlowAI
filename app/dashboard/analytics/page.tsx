"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Target, TrendingUp, Zap } from "lucide-react";
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

// ── Reusable SVG bar chart ────────────────────────────────────────────────────
function BarChart({
  data,
  labels,
  isDark,
  height = 180,
  color,
}: {
  data: number[];
  labels: string[];
  isDark: boolean;
  height?: number;
  color?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 560;
  const H = height + 60;
  const PAD_L = 32;
  const PAD_R = 16;
  const PAD_T = 36;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...data, 1);
  const gap = 8;
  const barW = (chartW - gap * (data.length - 1)) / data.length;

  const gridLines = [0, 0.5, 1].map((pct) => ({
    y: PAD_T + chartH * (1 - pct),
    label: Math.round(maxVal * pct),
  }));

  const accentColor = color ?? (isDark ? "#7c6ff7" : "#2563eb");
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "#71717a" : "#94a3b8";
  const tooltipBg = isDark ? "#1c1c21" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const tooltipText = isDark ? "#f4f4f5" : "#0f172a";

  return (
    <div className="w-full overflow-visible">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: `${H}px` }}>
        {gridLines.map(({ y, label }) => (
          <g key={y}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={gridColor} strokeWidth={1} />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10} fill={labelColor}>
              {label > 0 ? label : ""}
            </text>
          </g>
        ))}
        {data.map((value, idx) => {
          const x = PAD_L + idx * (barW + gap);
          const barH = value > 0 ? Math.max(4, (value / maxVal) * chartH) : 3;
          const y = PAD_T + chartH - barH;
          const isHov = hovered === idx;
          const fill = value > 0
            ? isHov ? accentColor : `${accentColor}cc`
            : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

          return (
            <g key={idx} onMouseEnter={() => setHovered(idx)} onMouseLeave={() => setHovered(null)} style={{ cursor: value > 0 ? "pointer" : "default" }}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} ry={4} fill={fill} style={{ transition: "fill 0.15s" }} />
              {isHov && value > 0 && (
                <g>
                  <rect x={x + barW / 2 - 28} y={Math.max(4, y - 32)} width={56} height={24} rx={6} ry={6}
                    fill={tooltipBg} stroke={tooltipBorder} strokeWidth={1} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
                  <text x={x + barW / 2} y={Math.max(4, y - 32) + 15} textAnchor="middle" fontSize={11} fontWeight="600" fill={tooltipText}>
                    {value}
                  </text>
                </g>
              )}
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={10}
                fill={isHov ? accentColor : labelColor} fontWeight={isHov ? "600" : "400"}>
                {labels[idx]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Donut chart for completion rate ──────────────────────────────────────────
function DonutChart({ rate, isDark }: { rate: number; isDark: boolean }) {
  const r = 52;
  const stroke = 12;
  const circ = 2 * Math.PI * r;
  const offset = circ - (rate / 100) * circ;
  const accent = isDark ? "#7c6ff7" : "#2563eb";

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 128 128" className="size-36 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.18)"} strokeWidth={stroke} />
        <motion.circle cx="64" cy="64" r={r} fill="none" stroke={accent} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold tracking-[-0.05em]">{rate}%</span>
        <span className={`text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-slate-400"}`}>completion</span>
      </div>
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

    let tasksReady = false, analyticsReady = false, eventsReady = false;
    const checkDone = () => { if (tasksReady && analyticsReady && eventsReady) setIsLoading(false); };

    const unsubTasks = subscribeToTasks(user.uid, (data) => { setTasks(data); tasksReady = true; checkDone(); });
    const unsubAnalytics = subscribeToAnalytics(user.uid, (data) => {
      const hasOldSeedData = data.avgFocusMinutes === 222 || data.weeklyGoal === 420 || data.tasksCompleted === 184;
      if (hasOldSeedData) {
        import("@/lib/firestoreCollections").then(({ updateAnalytics }) => {
          updateAnalytics(user.uid, { productivityScore: 0, tasksCompleted: 0, avgFocusMinutes: 0, weeklyActivity: [0,0,0,0,0,0,0], weeklyGoal: 10 }).catch(() => {});
        });
        setStoredAnalytics({ ...DEFAULT_ANALYTICS, weeklyGoal: 10 });
      } else {
        setStoredAnalytics(data);
      }
      analyticsReady = true; checkDone();
    });
    const unsubEvents = subscribeToEvents(user.uid, (data) => { setCalEvents(data); eventsReady = true; checkDone(); });

    return () => { unsubTasks(); unsubAnalytics(); unsubEvents(); };
  }, [isAuthReady, user]);

  const analytics = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    const todayMon = (new Date().getDay() + 6) % 7;
    const dayKeywords: [string, number][] = [
      ["monday",0],["mon",0],["tuesday",1],["tue",1],["wednesday",2],["wed",2],
      ["thursday",3],["thu",3],["friday",4],["fri",4],["saturday",5],["sat",5],["sunday",6],["sun",6],
    ];
    tasks.forEach((t) => {
      const due = t.dueDate.toLowerCase();
      if (/^\d{4}-\d{2}-\d{2}/.test(t.dueDate)) {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) { weeklyActivity[(d.getDay() + 6) % 7]++; return; }
      }
      if (due.includes("today")) weeklyActivity[todayMon]++;
      else if (due.includes("tomorrow")) weeklyActivity[(todayMon + 1) % 7]++;
      else { for (const [kw, idx] of dayKeywords) { if (due.includes(kw)) { weeklyActivity[idx]++; break; } } }
    });

    const dailyOutput = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    tasks.forEach((t) => {
      if (!t.dueDate || !/^\d{4}-\d{2}-\d{2}/.test(t.dueDate)) return;
      const d = new Date(t.dueDate);
      if (isNaN(d.getTime())) return;
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) dailyOutput[6 - diffDays]++;
    });

    const priorityBreakdown = {
      High:   tasks.filter((t) => t.priority === "High").length,
      Medium: tasks.filter((t) => t.priority === "Medium").length,
      Low:    tasks.filter((t) => t.priority === "Low").length,
    };

    const focusEvents = calEvents.filter((e) => e.type === "focus");
    let totalFocusMinutes = 0;
    focusEvents.forEach((e) => {
      const [sh, sm] = e.startTime.split(":").map(Number);
      const [eh, em] = e.endTime.split(":").map(Number);
      totalFocusMinutes += (eh * 60 + em) - (sh * 60 + sm);
    });
    const avgFocusMinutes = focusEvents.length > 0 ? Math.round(totalFocusMinutes / focusEvents.length) : 0;

    return {
      completionRate,
      tasksCompleted: completed,
      totalTasks: total,
      avgFocusMinutes,
      weeklyActivity,
      dailyOutput,
      priorityBreakdown,
      weeklyGoal: storedAnalytics.weeklyGoal === 420 ? 10 : (storedAnalytics.weeklyGoal || 10),
    };
  }, [tasks, calEvents, storedAnalytics.weeklyGoal]);

  const weeklyProgress = analytics.weeklyGoal > 0
    ? Math.min(100, Math.round((analytics.tasksCompleted / analytics.weeklyGoal) * 100))
    : 0;

  const last7Labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en", { weekday: "short" }).slice(0, 1);
  });

  const card = `rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"}`;

  return (
    <div className={isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"}>
      <DashboardSidebar />

      <div className="md:pl-[72px] lg:pl-60">
        <div className={`sticky top-0 z-20 border-b backdrop-blur ${isDark ? "border-white/10 bg-[#111114]/85" : "border-slate-200 bg-white/85"}`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>Analytics</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Performance Overview</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={card}><SkeletonRow /></div>
            )) : [
              { label: "Completion Rate", value: `${analytics.completionRate}%`, sub: `${analytics.tasksCompleted} of ${analytics.totalTasks} tasks`, icon: TrendingUp },
              { label: "Tasks Completed", value: `${analytics.tasksCompleted}`, sub: `${analytics.totalTasks} total`, icon: CheckCircle2 },
              { label: "Avg Focus Time", value: analytics.avgFocusMinutes > 0 ? `${Math.floor(analytics.avgFocusMinutes / 60)}h ${analytics.avgFocusMinutes % 60}m` : "—", sub: "Per focus session", icon: CalendarDays },
              { label: "Weekly Goal", value: `${weeklyProgress}%`, sub: `${analytics.tasksCompleted} / ${analytics.weeklyGoal} done`, icon: Zap },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.article key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={card}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>{stat.label}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{stat.value}</p>
                    </div>
                    <span className={`grid size-11 place-items-center rounded-2xl ${isDark ? "bg-white/5 text-[var(--color-accent)]" : "bg-slate-100 text-[var(--color-accent)]"}`}>
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? "text-zinc-500" : "text-slate-400"}`}>{stat.sub}</p>
                </motion.article>
              );
            })}
          </div>

          {/* Completion rate donut + priority breakdown */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-lg font-semibold">Task Completion Rate</h2>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Overall completion across all tasks</p>
              {isLoading ? <div className="mt-6"><SkeletonRow /></div> : (
                <div className="mt-6 flex items-center gap-8">
                  <DonutChart rate={analytics.completionRate} isDark={isDark} />
                  <div className="flex-1 space-y-3">
                    {[
                      { label: "Completed",   count: tasks.filter((t) => t.status === "Completed").length,   color: "bg-emerald-500" },
                      { label: "In Progress", count: tasks.filter((t) => t.status === "In Progress").length, color: "bg-blue-500" },
                      { label: "Pending",     count: tasks.filter((t) => t.status === "Pending").length,     color: "bg-amber-500" },
                      { label: "Backlog",     count: tasks.filter((t) => t.status === "Backlog").length,     color: "bg-slate-400" },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${color}`} />
                          <span className={isDark ? "text-zinc-400" : "text-slate-600"}>{label}</span>
                        </div>
                        <span className={`font-semibold ${isDark ? "text-zinc-300" : "text-slate-700"}`}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={card}>
              <h2 className="text-lg font-semibold">Priority Breakdown</h2>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Tasks by priority level</p>
              {isLoading ? <div className="mt-6"><SkeletonRow /></div> : (
                <div className="mt-6 space-y-4">
                  {[
                    { label: "High",   count: analytics.priorityBreakdown.High,   color: "bg-rose-500",    bar: "bg-rose-500" },
                    { label: "Medium", count: analytics.priorityBreakdown.Medium, color: "bg-amber-500",   bar: "bg-amber-500" },
                    { label: "Low",    count: analytics.priorityBreakdown.Low,    color: "bg-emerald-500", bar: "bg-emerald-500" },
                  ].map(({ label, count, color, bar }) => {
                    const pct = analytics.totalTasks > 0 ? Math.round((count / analytics.totalTasks) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`size-2.5 rounded-full ${color}`} />
                            <span className={isDark ? "text-zinc-300" : "text-slate-700"}>{label}</span>
                          </div>
                          <span className={`font-semibold ${isDark ? "text-zinc-400" : "text-slate-500"}`}>{count} ({pct}%)</span>
                        </div>
                        <div className={`h-2 w-full rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                          <motion.div className={`h-2 rounded-full ${bar}`}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                        </div>
                      </div>
                    );
                  })}

                  <div className={`mt-4 rounded-xl border p-4 ${isDark ? "border-white/10 bg-[#111114]" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`grid size-9 place-items-center rounded-xl ${isDark ? "bg-white/5 text-[var(--color-accent)]" : "bg-slate-100 text-[var(--color-accent)]"}`}>
                        <Target className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">Goal health</p>
                        <p className={`text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                          {tasks.length === 0 ? "Add tasks to start tracking"
                            : weeklyProgress >= 85 ? "On track for completion"
                            : weeklyProgress >= 50 ? "Making progress — keep going"
                            : "Focus sessions needed to recover pace"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Weekly activity + Daily output charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-lg font-semibold">Weekly Activity</h2>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Tasks by day of week</p>
              {isLoading ? <div className="mt-6 space-y-3"><SkeletonRow /><SkeletonRow /></div> : (
                <div className="mt-4">
                  <BarChart data={analytics.weeklyActivity} labels={DAYS.map((d) => d[0])} isDark={isDark} />
                </div>
              )}
            </div>

            <div className={card}>
              <h2 className="text-lg font-semibold">Daily Output</h2>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Tasks due in the last 7 days</p>
              {isLoading ? <div className="mt-6 space-y-3"><SkeletonRow /><SkeletonRow /></div> : (
                <div className="mt-4">
                  <BarChart data={analytics.dailyOutput} labels={last7Labels} isDark={isDark} color={isDark ? "#10b981" : "#059669"} />
                </div>
              )}
            </div>
          </div>

          {/* Time-to-completion */}
          <div className={card}>
            <h2 className="text-lg font-semibold">Time-to-Completion</h2>
            <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Average days from due date to completion, by priority</p>
            {isLoading ? <div className="mt-6"><SkeletonRow /></div> : (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "High Priority",   color: "text-rose-500",    bg: isDark ? "bg-rose-500/10" : "bg-rose-50",       ptasks: tasks.filter((t) => t.priority === "High"   && t.status === "Completed") },
                  { label: "Medium Priority", color: "text-amber-500",   bg: isDark ? "bg-amber-500/10" : "bg-amber-50",     ptasks: tasks.filter((t) => t.priority === "Medium" && t.status === "Completed") },
                  { label: "Low Priority",    color: "text-emerald-500", bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50", ptasks: tasks.filter((t) => t.priority === "Low"    && t.status === "Completed") },
                ].map(({ label, color, bg, ptasks }) => {
                  const withDates = ptasks.filter((t) => /^\d{4}-\d{2}-\d{2}/.test(t.dueDate));
                  const avg = withDates.length > 0
                    ? Math.round(withDates.reduce((sum, t) => {
                        const due = new Date(t.dueDate).getTime();
                        return sum + Math.max(0, Math.floor((Date.now() - due) / (1000 * 60 * 60 * 24)));
                      }, 0) / withDates.length)
                    : null;

                  return (
                    <div key={label} className={`rounded-xl p-4 ${bg}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                        {avg !== null ? `${avg}d` : "—"}
                      </p>
                      <p className={`mt-1 text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                        {ptasks.length} completed
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
