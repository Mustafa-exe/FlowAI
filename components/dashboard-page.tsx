"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  type Variants,
} from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChartColumn,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Puzzle,
  Rocket,
  Search,
  Settings2,
  Sparkles,
  Target,
  Video,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ThemeMode, useThemeMode } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/components/auth-provider";
import {
  subscribeToTasks,
  subscribeToEvents,
  subscribeToAnalytics,
  loadProfile,
  subscribeToProfile,
  clearSeedTasks,
  type UserProfile,
  type AnalyticsDoc,
} from "@/lib/firestoreCollections";
import type { Task as FirestoreTask } from "@/types/task";
import type { CalendarEvent } from "@/types/calendar";
import {
  requestNotificationPermission,
  scheduleTaskNotifications,
} from "@/lib/taskNotifications";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
};

type FilterValue = "all" | "pending" | "completed" | "upcoming";

type TaskStatus = Exclude<FilterValue, "all">;

type Priority = "High" | "Medium" | "Low";

// Dashboard-internal task shape (converted from Firestore tasks for display)
type DashTask = {
  id: number;
  title: string;
  desc: string;
  priority: Priority;
  deadline: string;
  status: TaskStatus;
  assignee: string;
  initials: string;
  avatarTone: string;
};

type EventType = "meeting" | "deadline" | "focus" | "planning";

type EventItem = {
  title: string;
  time: string;
  type: EventType;
  icon: LucideIcon;
};

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  when: string;
  unread?: boolean;
};

type StatCard = {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Tasks", icon: ListTodo },
  { label: "Calendar", icon: CalendarDays },
  { label: "Analytics", icon: ChartColumn },
  { label: "Integrations", icon: Puzzle },
  { label: "Settings", icon: Settings2 },
];

// ── Utility: format ISO datetime or human-readable dueDate ────────────────────
function formatDueDate(raw: string): string {
  if (!raw) return "—";
  // ISO datetime: "2026-05-22T23:03"
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en", { month: "short", day: "numeric" }) +
        ", " + d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
    }
  }
  // ISO date only: "2026-05-22"
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw + "T00:00");
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  return raw; // already human-readable ("Today, 3:00 PM")
}

const filterTabs: Array<{ label: string; value: FilterValue }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Upcoming", value: "upcoming" },
];

const statContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const statCardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const summaryVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.3,
    },
  },
};

const taskCardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      delay: index * 0.06,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
};

const eventTypeStyles: Record<EventType, { border: string; chip: string; icon: string }> = {
  meeting: {
    border: "border-l-blue-500",
    chip: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
    icon: "text-blue-600 dark:text-blue-300",
  },
  deadline: {
    border: "border-l-rose-500",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200",
    icon: "text-rose-600 dark:text-rose-300",
  },
  focus: {
    border: "border-l-violet-500",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200",
    icon: "text-violet-600 dark:text-violet-300",
  },
  planning: {
    border: "border-l-cyan-500",
    chip: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200",
    icon: "text-cyan-600 dark:text-cyan-300",
  },
};

const priorityStyles: Record<Priority, { chip: string; dot: string }> = {
  High: {
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  Medium: {
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  Low: {
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
};

const avatarStyles: Record<string, string> = {
  blue: "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  amber: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  rose: "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200",
  violet: "bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
};

export function DashboardPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const { user, isAuthReady } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [greeting, setGreeting] = useState("Hello");
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ── Live data from Firestore ───────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile>({ displayName: "", role: "", avatarUrl: null });
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsDoc | null>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Redirect unauthenticated users to login
  const router = useRouter();
  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace("/login");
    }
  }, [isAuthReady, user, router]);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    // Immediately seed display name from Firebase Auth — no async wait
    setProfile((prev) => ({
      ...prev,
      displayName: user.displayName || user.email?.split("@")[0] || "",
      avatarUrl: user.photoURL || null,
    }));

    // Remove any auto-seeded demo tasks silently
    clearSeedTasks(user.uid).catch(() => {});

    // Subscribe to profile — updates in real time when settings are saved
    const unsubProfile = subscribeToProfile(user.uid, (p) => {
      setProfile({
        displayName:
          (p.displayName && p.displayName !== "User" ? p.displayName : null) ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "User",
        role: p.role && p.role !== "Team Member" ? p.role : (p.role || "Team Member"),
        avatarUrl: p.avatarUrl || user.photoURL || null,
      });
    });

    // Subscribe to tasks
    const unsubTasks = subscribeToTasks(user.uid, setTasks);
    // Subscribe to calendar events
    const unsubEvents = subscribeToEvents(user.uid, setEvents);
    // Subscribe to analytics
    const unsubAnalytics = subscribeToAnalytics(user.uid, setAnalytics);

    return () => {
      unsubProfile();
      unsubTasks();
      unsubEvents();
      unsubAnalytics();
    };
  }, [isAuthReady, user]);

  // ── Browser push notifications ────────────────────────────────────────────
  // Request permission once on mount
  useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);

  // Schedule notifications whenever tasks change
  useEffect(() => {
    scheduleTaskNotifications(tasks);
  }, [tasks]);

  // ── Derived overview stats from live data ──────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const overviewStats = useMemo(() => {
    const pending        = tasks.filter((t) => t.status === "Pending" || t.status === "In Progress").length;
    const completedToday = tasks.filter((t) => t.status === "Completed" && t.dueDate.toLowerCase().includes("today")).length;
    const upcomingCount  = events.filter((e) => e.date >= today && !e.completed).length;
    const aiActions      = analytics?.tasksCompleted ?? 0;
    return [
      { label: "Pending Tasks",    value: pending,        icon: Clock3,       accent: "amber" },
      { label: "Completed Today",  value: completedToday, icon: CheckCircle2, accent: "emerald" },
      { label: "Upcoming Events",  value: upcomingCount,  icon: CalendarDays, accent: "blue" },
      { label: "AI Actions Taken", value: aiActions,      icon: Zap,          accent: "violet" },
    ] as StatCard[];
  }, [tasks, events, analytics, today]);

  // ── Notifications derived from tasks (due today / recently completed) ──────
  const liveNotifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    tasks
      .filter((t) => t.dueDate.toLowerCase().includes("today") && t.status !== "Completed")
      .slice(0, 2)
      .forEach((t, i) => {
        items.push({ id: i + 1, title: "Deadline reminder", message: `"${t.title}" is due today.`, when: "Now", unread: true });
      });
    tasks
      .filter((t) => t.status === "Completed")
      .slice(0, 1)
      .forEach((t) => {
        items.push({ id: items.length + 1, title: "Task completed", message: `"${t.title}" was marked complete.`, when: "Recently" });
      });
    return items;
  }, [tasks]);

  // ── Upcoming events for the strip ─────────────────────────────────────────
  const upcomingEvents = useMemo<EventItem[]>(() => {
    return events
      .filter((e) => e.date >= today && !e.completed)
      .slice(0, 4)
      .map((e) => ({
        title: e.title,
        time: `${e.date === today ? "Today" : e.date}, ${e.startTime}`,
        type: (e.type === "task" ? "deadline" : e.type) as EventType,
        icon: e.type === "meeting" ? Video : e.type === "focus" ? Target : e.type === "deadline" ? CalendarClock : Rocket,
      }));
  }, [events, today]);

  const unreadCount = liveNotifications.filter((n) => n.unread).length;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const shellClassName = isDark ? "bg-[#111114] text-zinc-100" : "bg-[#f8fafc] text-slate-900";
  const sidebarClassName = isDark ? "bg-[#0d0d0f] text-zinc-100 border-white/5" : "bg-white text-slate-900 border-slate-200";

  const displayName = profile.displayName || user?.displayName || user?.email?.split("@")[0] || "there";
  const userInitials = displayName.charAt(0).toUpperCase();

  return (
    <div className={`min-h-screen ${shellClassName}`} style={{ backgroundColor: isDark ? "var(--flowai-dark-surface-2)" : "var(--flowai-light-bg)" }}>
      <DesktopSidebar isDark={isDark} activeNav={activeNav} setActiveNav={setActiveNav} sidebarClassName={sidebarClassName}
        displayName={displayName} role={profile.role} initials={userInitials} />
      <MobileSidebar isDark={isDark} activeNav={activeNav} setActiveNav={setActiveNav} sidebarClassName={sidebarClassName}
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
        displayName={displayName} role={profile.role} initials={userInitials} />

      <div className="md:pl-20 lg:pl-60">
        <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <TopBar
            greeting={greeting}
            isDark={isDark}
            activeNav={activeNav}
            searchQuery={searchQuery}
            unreadCount={unreadCount}
            notificationsOpen={notificationsOpen}
            profileOpen={profileOpen}
            notifications={liveNotifications}
            displayName={displayName}
            initials={userInitials}
            onMenuClick={() => setMobileMenuOpen(true)}
            onSearchChange={setSearchQuery}
            onToggleNotifications={() => { setNotificationsOpen((c) => !c); setProfileOpen(false); }}
            onToggleProfile={() => { setProfileOpen((c) => !c); setNotificationsOpen(false); }}
          />
          {activeNav === "Dashboard" ? (
            <>
              <OverviewSection isDark={isDark} stats={overviewStats} />
              <SummaryCard isDark={isDark} analytics={analytics} />
              <TaskBoard isDark={isDark} searchQuery={normalizedQuery} liveTasks={tasks} />
              <EventsStrip isDark={isDark} searchQuery={normalizedQuery} liveEvents={upcomingEvents} />
            </>
          ) : (
            <FeaturePagePanel isDark={isDark} activeNav={activeNav} searchQuery={normalizedQuery} />
          )}
        </main>
      </div>

      {/* Floating AI Chat button */}
      <Link
        href="/dashboard/chat"
        aria-label="Open AI Chat"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 ${
          isDark
            ? "bg-[#7c6ff7] text-white hover:bg-[#6a5fe6] shadow-[#7c6ff7]/30"
            : "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-[#2563eb]/30"
        }`}
      >
        <MessageCircle className="size-4" />
        <span>AI Chat</span>
      </Link>
    </div>
  );
}

function DesktopSidebar({
  isDark,
  activeNav,
  setActiveNav,
  sidebarClassName,
  displayName,
  role,
  initials,
}: {
  isDark: boolean;
  activeNav: string;
  setActiveNav: (value: string) => void;
  sidebarClassName: string;
  displayName: string;
  role: string;
  initials: string;
}) {
  const { signOutUser } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.replace("/login");
  };
  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-screen w-20 flex-col border-r px-3 py-5 md:flex lg:w-60 lg:px-4 ${sidebarClassName}`}
      style={{ backgroundColor: isDark ? "var(--flowai-dark-bg)" : "var(--flowai-light-surface)" }}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <Link href="/" className="flex items-center gap-3">
          <span
            className={`grid size-10 place-items-center rounded-2xl text-sm font-semibold tracking-[-0.04em] ${
              isDark ? "bg-[#7c6ff7] text-white" : "bg-[#2563eb] text-white"
            }`}
          >
            F
          </span>
          <span className="hidden text-lg font-semibold tracking-[-0.05em] lg:inline">FlowAI</span>
        </Link>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {sidebarItems.map((item) => {
          const active = activeNav === item.label;
          const Icon = item.icon;
          const routeHref =
            item.label === "Tasks"
              ? "/dashboard/tasks"
              : item.label === "Settings"
                ? "/settings"
                : item.label === "Calendar"
                  ? "/dashboard/calendar"
                  : item.label === "Analytics"
                    ? "/dashboard/analytics"
                    : null;
          const itemClassName = `group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
            active
              ? isDark
                ? "bg-white/8 text-zinc-100"
                : "bg-slate-100 text-slate-900"
              : isDark
                ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`;

          return (
            routeHref ? (
              <Link key={item.label} href={routeHref} className={itemClassName}>
                <span
                  className={`grid size-9 place-items-center rounded-xl transition ${
                    active
                      ? isDark
                        ? "bg-[#7c6ff7]/20 text-[#c7bfff]"
                        : "bg-[#2563eb]/10 text-[#2563eb]"
                      : isDark
                        ? "bg-white/5 text-zinc-300"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="hidden text-sm font-medium lg:inline">{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveNav(item.label)}
                aria-current={active ? "page" : undefined}
                className={itemClassName}
              >
                <span
                  className={`grid size-9 place-items-center rounded-xl transition ${
                    active
                      ? isDark
                        ? "bg-[#7c6ff7]/20 text-[#c7bfff]"
                        : "bg-[#2563eb]/10 text-[#2563eb]"
                      : isDark
                        ? "bg-white/5 text-zinc-300"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="hidden text-sm font-medium lg:inline">{item.label}</span>
              </button>
            )
          );
        })}
      </nav>

      <div className={`rounded-[1.35rem] border p-3 ${isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex items-center gap-3">
          <Avatar initials={initials} isDark={isDark} />
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className={isDark ? "text-xs text-zinc-500" : "text-xs text-slate-500"}>{role}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            isDark
              ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
          }`}
        >
          <LogOut className="size-4" />
          <span className="hidden lg:inline">Logout</span>
        </button>
      </div>
    </aside>
  );
}

function MobileSidebar({
  isDark,
  activeNav,
  setActiveNav,
  sidebarClassName,
  mobileMenuOpen,
  setMobileMenuOpen,
  displayName,
  role,
  initials,
}: {
  isDark: boolean;
  activeNav: string;
  setActiveNav: (value: string) => void;
  sidebarClassName: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
  displayName: string;
  role: string;
  initials: string;
}) {
  const { signOutUser } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.replace("/login");
  };

  return (
    <AnimatePresence>
      {mobileMenuOpen ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
            aria-label="Close navigation drawer"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r px-5 py-5 md:hidden ${sidebarClassName}`}
          >
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className={`grid size-10 place-items-center rounded-2xl text-sm font-semibold ${isDark ? "bg-[#7c6ff7] text-white" : "bg-[#2563eb] text-white"}`}>
                  F
                </span>
                <span className="text-lg font-semibold tracking-[-0.05em]">FlowAI</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className={`inline-flex size-10 items-center justify-center rounded-full border ${
                  isDark ? "border-white/10 bg-white/5 text-zinc-100" : "border-slate-200 bg-white text-slate-900"
                }`}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-8 flex flex-1 flex-col gap-2">
              {sidebarItems.map((item) => {
                const active = activeNav === item.label;
                const Icon = item.icon;
                const routeHref =
                  item.label === "Tasks"
                    ? "/dashboard/tasks"
                    : item.label === "Settings"
                      ? "/settings"
                      : item.label === "Calendar"
                        ? "/dashboard/calendar"
                        : item.label === "Analytics"
                          ? "/dashboard/analytics"
                          : null;
                const itemClassName = `flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  active
                    ? isDark
                      ? "bg-white/8 text-zinc-100"
                      : "bg-slate-100 text-slate-900"
                    : isDark
                      ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`;

                return (
                  routeHref ? (
                    <Link
                      key={item.label}
                      href={routeHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className={itemClassName}
                    >
                      <span
                        className={`grid size-9 place-items-center rounded-xl ${
                          active
                            ? isDark
                              ? "bg-[#7c6ff7]/20 text-[#c7bfff]"
                              : "bg-[#2563eb]/10 text-[#2563eb]"
                            : isDark
                              ? "bg-white/5 text-zinc-300"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setActiveNav(item.label);
                        setMobileMenuOpen(false);
                      }}
                      aria-current={active ? "page" : undefined}
                      className={itemClassName}
                    >
                      <span
                        className={`grid size-9 place-items-center rounded-xl ${
                          active
                            ? isDark
                              ? "bg-[#7c6ff7]/20 text-[#c7bfff]"
                              : "bg-[#2563eb]/10 text-[#2563eb]"
                            : isDark
                              ? "bg-white/5 text-zinc-300"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  )
                );
              })}
            </nav>

            <div className={`rounded-[1.35rem] border p-3 ${isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center gap-3">
                <Avatar initials={initials} isDark={isDark} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className={isDark ? "text-xs text-zinc-500" : "text-xs text-slate-500"}>{role}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isDark
                    ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function TopBar({
  greeting,
  isDark,
  activeNav,
  searchQuery,
  unreadCount,
  notificationsOpen,
  profileOpen,
  notifications,
  displayName,
  initials,
  onMenuClick,
  onSearchChange,
  onToggleNotifications,
  onToggleProfile,
}: {
  greeting: string;
  isDark: boolean;
  activeNav: string;
  searchQuery: string;
  unreadCount: number;
  notificationsOpen: boolean;
  profileOpen: boolean;
  notifications: NotificationItem[];
  displayName: string;
  initials: string;
  onMenuClick: () => void;
  onSearchChange: (value: string) => void;
  onToggleNotifications: () => void;
  onToggleProfile: () => void;
}) {
  const { signOutUser } = useAuth();
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const handleSignOut = async () => {
    await signOutUser();
    router.replace("/login");
  };

  const markRead = (id: number) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };
  return (
    <section className="pb-6 pt-2">
      <div className="flex items-start gap-4 lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className={`mt-1 inline-flex size-11 items-center justify-center rounded-full border md:hidden ${
              isDark ? "border-white/10 bg-white/5 text-zinc-100" : "border-slate-200 bg-white text-slate-900"
            }`}
            aria-label="Open navigation drawer"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0">
            <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500" : "text-xs font-semibold uppercase tracking-[0.34em] text-slate-500"}>
              {activeNav} Workspace
            </p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.06em] text-balance">
              {greeting}, {displayName} <span className="inline-block">👋</span>
            </h1>
            <p className={isDark ? "mt-1 text-sm text-zinc-400" : "mt-1 text-sm text-slate-500"}>Here&apos;s what&apos;s happening in FlowAI today.</p>
          </div>
        </div>

        <div className="relative flex items-start gap-2 pt-1 lg:gap-3">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          <button
            type="button"
            className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition lg:inline-flex ${
              isDark ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <CircleHelp className="size-4" />
            Feedback
          </button>

          <div
            className={`hidden min-w-[280px] items-center gap-3 rounded-full border px-4 py-3 md:flex ${
              isDark ? "border-white/10 bg-white/5 text-zinc-100" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <Search className="size-4 shrink-0" />
            <input
              type="search"
              aria-label="Search tasks"
              placeholder="Search operations..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className={`w-full bg-transparent text-sm outline-none placeholder:text-current/60 ${isDark ? "text-zinc-100" : "text-slate-700"}`}
            />
          </div>

          <button
            type="button"
            onClick={onToggleNotifications}
            className={`relative inline-flex size-11 items-center justify-center rounded-full border transition ${
              isDark ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
            aria-label="Notifications"
            aria-haspopup="menu"
            aria-expanded={notificationsOpen}
            aria-controls="notification-menu"
          >
            <Bell className="size-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={onToggleProfile}
            className={`inline-flex items-center gap-3 rounded-full border px-2 py-1.5 pr-4 transition ${
              isDark ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
            aria-label="User account"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-controls="profile-menu"
          >
            <Avatar initials={initials} isDark={isDark} size="sm" />
            <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
            <ChevronDown className="size-4 opacity-70" />
          </button>

          <div className="lg:hidden">
            <ThemeToggle compact />
          </div>

          <AnimatePresence>
            {notificationsOpen ? (
              <motion.div
                id="notification-menu"
                role="menu"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`absolute right-16 top-14 z-50 w-[320px] rounded-2xl border p-3 shadow-xl ${
                  isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between px-2 pb-2">
                  <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                    Notifications
                  </p>
                  {notifications.some((n) => n.unread && !readIds.has(n.id)) && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className={`text-xs font-medium text-[var(--color-accent)] hover:underline`}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className={`px-3 py-4 text-sm ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                    No notifications yet.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {notifications.map((item) => {
                      const isRead = readIds.has(item.id) || !item.unread;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => markRead(item.id)}
                            className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                              isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                            } ${isRead ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className={`text-sm font-semibold ${isDark ? "text-zinc-100" : "text-slate-900"}`}>{item.title}</p>
                              {!isRead ? <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-500" aria-hidden="true" /> : null}
                            </div>
                            <p className={`mt-1 text-xs ${isDark ? "text-zinc-400" : "text-slate-600"}`}>{item.message}</p>
                            <p className={`mt-1 text-[11px] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>{item.when}</p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {profileOpen ? (
              <motion.div
                id="profile-menu"
                role="menu"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`absolute right-0 top-14 z-50 w-56 rounded-2xl border p-2 shadow-xl ${
                  isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"
                }`}
              >
                <div className={`mb-1 px-3 py-2 ${isDark ? "border-b border-white/8" : "border-b border-slate-100"}`}>
                  <p className={`text-sm font-semibold truncate ${isDark ? "text-zinc-100" : "text-slate-900"}`}>{displayName}</p>
                </div>
                <Link
                  href="/settings"
                  role="menuitem"
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                >
                  Account settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-500 transition ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function OverviewSection({ isDark, stats }: { isDark: boolean; stats: StatCard[] }) {
  return (
    <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={statContainerVariants} className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const accentClass = getAccentClasses(stat.accent, isDark);

        return (
          <motion.article
            key={stat.label}
            variants={statCardVariants}
            className={`relative rounded-[1.5rem] border p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.22)] ${
              isDark ? "border-white/5 bg-[#16161a]" : "border-slate-200 bg-white"
            }`}
          >
            <div className={`inline-flex size-11 items-center justify-center rounded-2xl ${accentClass.square}`}>
              <Icon className={`size-5 ${accentClass.icon}`} />
            </div>

            <div className={`mt-5 text-4xl font-semibold tracking-[-0.05em] ${accentClass.value}`}>
              <CountUpNumber end={stat.value} />
            </div>
            <p className={`mt-2 text-sm font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>{stat.label}</p>
          </motion.article>
        );
      })}
    </motion.section>
  );
}

function SummaryCard({ isDark, analytics }: { isDark: boolean; analytics: AnalyticsDoc | null }) {
  const completedCount = analytics?.tasksCompleted ?? 0;
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.section
      variants={summaryVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className={`relative mt-4 overflow-hidden rounded-[2rem] border p-6 lg:p-8 ${
        isDark
          ? "border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(124,111,247,0.12),transparent_45%),linear-gradient(135deg,#16161a_0%,#111114_100%)]"
          : "border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(124,111,247,0.14),transparent_42%),linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)]"
      }`}
    >
      <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_auto]">
        <div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] ${
              isDark ? "bg-white/6 text-[#c7bfff]" : "bg-white text-[#7c6ff7] shadow-[0_12px_30px_-24px_rgba(124,111,247,0.45)]"
            }`}
          >
            <Sparkles className="size-3.5" />
            AI Summary
          </span>

          <h2 className={`mt-5 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
            Here&apos;s your day at a glance
          </h2>

          <p className={`mt-4 max-w-3xl text-base leading-8 ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
            Your workspace productivity is at {analytics?.productivityScore ?? 0}%. You have {completedCount} tasks completed so far. FlowAI is monitoring your workload and will surface recommendations as patterns emerge.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/chat?prompt=Give+me+AI+suggestions+to+improve+my+productivity+today")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                isDark
                  ? "border-[#7c6ff7] bg-[#7c6ff7] text-white hover:bg-[#8f84ff]"
                  : "border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
              }`}
            >
              Apply Suggestions
            </button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                isDark
                  ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              Dismiss
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <CompletionRing progress={analytics ? Math.min(100, analytics.productivityScore) : 0} isDark={isDark} />
        </div>
      </div>
    </motion.section>
  );
}

function TaskBoard({ isDark, searchQuery, liveTasks }: { isDark: boolean; searchQuery: string; liveTasks: FirestoreTask[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = normalizeFilter(searchParams.get("filter"));

  const mapStatus = (s: string): TaskStatus => {
    if (s === "Completed") return "completed";
    if (s === "In Progress" || s === "Pending") return "pending";
    return "upcoming";
  };

  const dashTasks: DashTask[] = useMemo(() => liveTasks.map((t) => ({
    id: parseInt(t.id, 36) || Math.random() * 1000 | 0,
    title: t.title,
    desc: t.description,
    priority: t.priority as Priority,
    deadline: t.dueDate,
    status: mapStatus(t.status),
    assignee: t.assignee || "You",
    initials: (t.assignee || "Y").charAt(0).toUpperCase(),
    avatarTone: ["blue","amber","emerald","rose","cyan","violet"][Math.abs(t.title.charCodeAt(0)) % 6],
  })), [liveTasks]);

  const filteredTasks = useMemo(
    () =>
      (filter === "all" ? dashTasks : dashTasks.filter((task) => task.status === filter)).filter((task) => {
        if (!searchQuery) return true;
        const searchable = `${task.title} ${task.desc} ${task.assignee} ${task.status} ${task.priority}`.toLowerCase();
        return searchable.includes(searchQuery);
      }),
    [filter, searchQuery, dashTasks],
  );

  const updateFilter = (nextFilter: FilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", nextFilter);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>Active Workflow</p>
          <h2 className={`mt-2 text-[clamp(1.6rem,3vw,2.3rem)] font-semibold tracking-[-0.05em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
            Cards, not tables
          </h2>
        </div>

        <div
          className={`inline-flex rounded-full border p-1 ${isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-white"}`}
          aria-label="Task filters"
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateFilter(tab.value)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${active ? "text-white" : isDark ? "text-zinc-400 hover:text-zinc-100" : "text-slate-500 hover:text-slate-900"}`}
                aria-pressed={active}
              >
                {active ? (
                  <motion.span
                    layoutId="task-filter-active"
                    className={`absolute inset-0 rounded-full ${isDark ? "bg-[#7c6ff7]" : "bg-[#2563eb]"}`}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredTasks.length > 0 ? (
            <motion.div
              key={filter}
              className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
            >
              {filteredTasks.map((task, index) => (
                <TaskCard key={`${task.id}-${filter}`} task={task} index={index} isDark={isDark} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`${filter}-empty`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
              className={`rounded-[1.5rem] border p-8 text-sm ${isDark ? "border-white/5 bg-[#16161a] text-zinc-400" : "border-slate-200 bg-white text-slate-500"}`}
            >
              No tasks match this filter.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function TaskCard({ task, index, isDark }: { task: DashTask; index: number; isDark: boolean }) {
  const StatusIcon = getStatusIcon(task.status);
  const priority = priorityStyles[task.priority];
  const avatar = avatarStyles[task.avatarTone] ?? avatarStyles.blue;

  return (
    <motion.article
      custom={index}
      variants={taskCardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      layout
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ duration: 0.2 }}
      className={`rounded-[1.5rem] border p-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.2)] ${isDark ? "border-white/5 bg-[#16161a]" : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${priority.chip}`}>
          <span className={`size-2 rounded-full ${priority.dot}`} />
          {task.priority}
        </span>

        <button
          type="button"
          className={`inline-flex size-8 items-center justify-center rounded-full transition ${
            isDark ? "text-zinc-500 hover:bg-white/5 hover:text-zinc-100" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          }`}
          aria-label={`Task options for ${task.title}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <h3 className={`mt-4 text-xl font-semibold tracking-[-0.04em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>{task.title}</h3>
      <p className={`mt-2 text-sm leading-6 ${isDark ? "text-zinc-400" : "text-slate-600"}`}>{task.desc}</p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            isDark ? "bg-white/5 text-zinc-300" : "bg-slate-100 text-slate-600"
          }`}
        >
          <CalendarClock className="size-3.5" />
          {formatDueDate(task.deadline)}
        </span>

        <div className="flex items-center gap-2">
          <Avatar initials={task.initials} isDark={isDark} tone={task.avatarTone} />
          <StatusIcon className={`size-4 ${isDark ? "text-zinc-400" : "text-slate-400"}`} />
        </div>
      </div>
    </motion.article>
  );
}

function EventsStrip({ isDark, searchQuery, liveEvents }: { isDark: boolean; searchQuery: string; liveEvents: EventItem[] }) {
  const filteredEvents = liveEvents.filter((event) => {
    if (!searchQuery) {
      return true;
    }

    return `${event.title} ${event.time} ${event.type}`.toLowerCase().includes(searchQuery);
  });

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>Upcoming Events</p>
          <h2 className={`mt-2 text-[clamp(1.4rem,2.6vw,2rem)] font-semibold tracking-[-0.05em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
            Calendar Strip
          </h2>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {filteredEvents.length === 0 ? (
          <div className={`w-full rounded-[1.25rem] border px-4 py-5 text-sm ${isDark ? "border-white/5 bg-[#16161a] text-zinc-400" : "border-slate-200 bg-white text-slate-500"}`}>
            No events match your search.
          </div>
        ) : null}
        {filteredEvents.map((event) => {
          const Icon = event.icon;
          const styles = eventTypeStyles[event.type];

          return (
            <motion.article
              key={`${event.title}-${event.time}`}
              whileHover={{ y: -3 }}
              className={`min-w-[220px] rounded-[1.35rem] border-l-4 p-4 ${styles.border} ${
                isDark ? "border-white/5 bg-[#16161a]" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`grid size-10 place-items-center rounded-2xl ${styles.chip}`}>
                  <Icon className={`size-4 ${styles.icon}`} />
                </div>

                <div>
                  <h3 className={`text-sm font-semibold tracking-[-0.03em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>{event.title}</h3>
                  <p className={`mt-1 text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>{event.time}</p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function FeaturePagePanel({ isDark, activeNav, searchQuery }: { isDark: boolean; activeNav: string; searchQuery: string }) {
  // All nav items now have dedicated routes — this panel is a fallback
  const routeMap: Record<string, string> = {
    Tasks: "/dashboard/tasks",
    Calendar: "/dashboard/calendar",
    Analytics: "/dashboard/analytics",
    Integrations: "/dashboard/integrations",
    Settings: "/settings",
  };
  const href = routeMap[activeNav];

  return (
    <section className="mt-8">
      <article className={`rounded-[1.8rem] border p-6 lg:p-8 ${isDark ? "border-white/5 bg-[#16161a]" : "border-slate-200 bg-white"}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>{activeNav}</p>
        <h2 className={`mt-3 text-[clamp(1.7rem,3vw,2.4rem)] font-semibold tracking-[-0.05em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
          {activeNav}
        </h2>
        {href && (
          <a
            href={href}
            className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition ${
              isDark ? "bg-[#7c6ff7] hover:bg-[#8f84ff]" : "bg-[#2563eb] hover:bg-[#1d4ed8]"
            }`}
          >
            Open {activeNav} →
          </a>
        )}
      </article>
    </section>
  );
}

function Avatar({ initials, isDark, tone = "blue", size = "md" }: { initials: string; isDark: boolean; tone?: string; size?: "sm" | "md" }) {
  const toneClass = avatarStyles[tone] ?? avatarStyles.blue;
  const sizeClass = size === "sm" ? "size-8 text-[11px]" : "size-10 text-sm";

  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${sizeClass} ${toneClass} ${isDark ? "ring-1 ring-white/8" : "ring-1 ring-slate-200"}`}>
      {initials}
    </span>
  );
}

function CountUpNumber({ end }: { end: number }) {
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, end, { duration: 1, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [end, motionValue]);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplayValue(latest);
  });

  return <span>{displayValue.toFixed(0)}</span>;
}

function CompletionRing({ progress, isDark }: { progress: number; isDark: boolean }) {
  const radius = 52;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`rounded-full p-3 ${isDark ? "bg-white/5" : "bg-white"}`}>
      <svg viewBox="0 0 128 128" className="size-32 -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.18)"} strokeWidth={stroke} />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={isDark ? "#7c6ff7" : "#2563eb"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      <div className="-mt-32 flex h-32 w-32 flex-col items-center justify-center rounded-full px-2 text-center">
        <span className={`text-3xl font-semibold tracking-[-0.05em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>{progress}%</span>
        <span className={`mt-1 text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-slate-500"}`}>Daily completion</span>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function normalizeFilter(value: string | null): FilterValue {
  if (value === "pending" || value === "completed" || value === "upcoming" || value === "all") {
    return value;
  }

  return "all";
}

function getAccentClasses(accent: string, isDark: boolean) {
  const lightMap: Record<string, { square: string; icon: string; value: string }> = {
    amber: { square: "bg-amber-50 text-amber-600", icon: "text-amber-600", value: "text-amber-600" },
    emerald: { square: "bg-emerald-50 text-emerald-600", icon: "text-emerald-600", value: "text-emerald-600" },
    blue: { square: "bg-blue-50 text-blue-600", icon: "text-blue-600", value: "text-blue-600" },
    violet: { square: "bg-violet-50 text-violet-600", icon: "text-violet-600", value: "text-violet-600" },
  };

  const darkMap: Record<string, { square: string; icon: string; value: string }> = {
    amber: { square: "bg-white/5 text-amber-300", icon: "text-amber-300", value: "text-amber-300" },
    emerald: { square: "bg-white/5 text-emerald-300", icon: "text-emerald-300", value: "text-emerald-300" },
    blue: { square: "bg-white/5 text-blue-300", icon: "text-blue-300", value: "text-blue-300" },
    violet: { square: "bg-white/5 text-[#c7bfff]", icon: "text-[#c7bfff]", value: "text-[#c7bfff]" },
  };

  return (isDark ? darkMap[accent] : lightMap[accent]) ?? (isDark ? darkMap.blue : lightMap.blue);
}

function getStatusIcon(status: TaskStatus) {
  if (status === "completed") {
    return CheckCircle2;
  }

  if (status === "upcoming") {
    return CalendarClock;
  }

  return Clock3;
}