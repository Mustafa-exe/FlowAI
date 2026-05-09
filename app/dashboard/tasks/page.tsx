"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock3, ListTodo, Plus,
  AlertTriangle, CheckCircle2, SlidersHorizontal,
} from "lucide-react";
import TaskListView from "@/components/tasks/TaskListView";
import TaskKanbanView from "@/components/tasks/TaskKanbanView";
import TaskModal from "@/components/tasks/TaskModal";
import ViewToggle from "@/components/tasks/ViewToggle";
import { Task } from "@/types/task";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import {
  subscribeToTasks,
  addTask,
  updateTask,
  deleteTask,
  clearSeedTasks,
} from "@/lib/firestoreCollections";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function TasksPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const { user, isAuthReady, getGCalToken } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [sortBy, setSortBy] = useState("Due Date");
  const [search, setSearch] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Subscribe to Firestore tasks ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady || !user) {
      setIsLoading(false);
      return;
    }
    // Remove any auto-seeded demo tasks silently
    clearSeedTasks(user.uid).catch(() => {});
    setIsLoading(true);
    const unsub = subscribeToTasks(user.uid, (data) => {
      setTasks(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [isAuthReady, user]);

  useEffect(() => {
    const f = searchParams.get("filter") || "all";
    setFilter(f);
  }, [searchParams]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleAddTask = async (task: Task) => {
    if (!user) {
      console.warn("Cannot add task: user not signed in");
      return;
    }
    const { id: _id, ...rest } = task;
    const taskData = {
      ...rest,
      assignee: user.displayName || user.email?.split("@")[0] || "Me",
    };

    try {
      // 1. Save to Firestore
      await addTask(user.uid, taskData);

      // 2. If Google Calendar is connected, also create a calendar event
      const gcalToken = await getGCalToken();
      if (gcalToken && taskData.dueDate) {
        createCalendarEvent(gcalToken, {
          title: taskData.title,
          description: taskData.description,
          dueDate: taskData.dueDate,
          priority: taskData.priority,
        }).catch((err) => {
          // Non-fatal — task was saved to Firestore, GCal sync failed silently
          console.warn("Google Calendar sync failed:", err.message);
        });
      }

      setModalOpen(false);
    } catch (err: any) {
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please update your Firestore security rules.");
      } else {
        console.error("Failed to add task:", err);
      }
    }
  };

  const handleEditTask = async (updated: Task) => {
    if (!user) return;
    const { id, ...rest } = updated;
    try {
      await updateTask(user.uid, id, rest);
      setEditingTask(null);
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteTask(user.uid, id);
      setEditingTask(null);
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    if (!user) return;
    try {
      await updateTask(user.uid, id, { status });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const visibleTasks = useMemo(() => {
    let next = [...tasks];
    if (priorityFilter !== "All Priorities") next = next.filter((t) => t.priority === priorityFilter);
    if (search.trim()) {
      const needle = search.toLowerCase();
      next = next.filter((t) =>
        `${t.title} ${t.description} ${t.tags.join(" ")}`.toLowerCase().includes(needle)
      );
    }
    if (sortBy === "Priority") {
      const order = { High: 0, Medium: 1, Low: 2 };
      next.sort((a, b) => order[a.priority] - order[b.priority]);
    }
    return next;
  }, [tasks, priorityFilter, search, sortBy]);

  const stats = useMemo(() => {
    const dueToday  = visibleTasks.filter((t) => t.dueDate.toLowerCase().includes("today")).length;
    const completed = visibleTasks.filter((t) => t.status === "Completed").length;
    const overdue   = visibleTasks.filter((t) => t.status !== "Completed" && t.dueDate.toLowerCase().includes("overdue")).length;
    return [
      { label: "Active Tasks", value: visibleTasks.length, hint: "Total",    icon: ListTodo,       accent: isDark ? "text-[#9b8dff]" : "text-[#2563eb]" },
      { label: "Due Today",    value: dueToday,            hint: "Today",    icon: Clock3,         accent: "text-amber-500" },
      { label: "Overdue",      value: overdue,             hint: "Critical", icon: AlertTriangle,  accent: "text-rose-500" },
      { label: "Completed",    value: completed,           hint: "Total",    icon: CheckCircle2,   accent: "text-cyan-500" },
    ];
  }, [visibleTasks, isDark]);

  return (
    <div className={isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"}>
      <DashboardSidebar />

      <div className="md:pl-[72px] lg:pl-60">
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-200 pb-3 dark:border-white/10">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-[-0.03em]">Tasks</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden lg:block">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Quick search tasks..."
                  className="w-44 rounded-full border border-slate-200 bg-slate-50 px-8 py-1.5 text-xs outline-none dark:border-white/10 dark:bg-white/5" />
                <span className="pointer-events-none absolute left-3 top-1.5 text-xs text-slate-400">⌕</span>
              </div>
              <ThemeToggle compact />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <select value={filter} onChange={(e) => handleFilterChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-white/10 dark:bg-[#16161a]" aria-label="Status filter">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="backlog">Backlog</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-white/10 dark:bg-[#16161a]" aria-label="Priority filter">
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-white/10 dark:bg-[#16161a]" aria-label="Sort tasks">
              <option>Due Date</option>
              <option>Priority</option>
            </select>
            <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-[#16161a]" aria-label="More filters">
              <SlidersHorizontal size={14} />
            </button>
            <ViewToggle view={view} onChange={setView} />
            <button onClick={() => { setEditingTask(null); setModalOpen(true); }}
              className="add-task-btn flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white">
              <Plus size={16} />
              Add Task
            </button>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-[#121219]" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-start justify-between">
                    <span className={`grid size-8 place-items-center rounded-lg ${isDark ? "bg-white/5" : "bg-slate-100"} ${stat.accent}`}>
                      <Icon size={15} />
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>{stat.hint}</span>
                  </div>
                  <p className="mt-3 text-5xl font-semibold tracking-[-0.04em]">{String(stat.value).padStart(2, "0")}</p>
                  <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-600"}`}>{stat.label}</p>
                </article>
              );
            })}
          </section>

          {/* Task views */}
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {view === "list" ? (
                <TaskListView tasks={visibleTasks} activeFilter={filter} onFilterChange={handleFilterChange}
                  onEditTask={(task) => { setEditingTask(task); setModalOpen(true); }}
                  onDeleteTask={handleDeleteTask} onStatusChange={handleStatusChange} />
              ) : (
                <TaskKanbanView tasks={visibleTasks}
                  onAdd={(status) => { setEditingTask({ id: "", title: "", description: "", priority: "Medium", status, dueDate: "", assignee: "", tags: [] }); setModalOpen(true); }}
                  onEdit={(task) => { setEditingTask(task); setModalOpen(true); }}
                  onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TaskModal open={modalOpen} task={editingTask}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={(task) => { editingTask?.id ? handleEditTask(task) : handleAddTask(task); }}
        onDelete={handleDeleteTask} />
    </div>
  );
}
