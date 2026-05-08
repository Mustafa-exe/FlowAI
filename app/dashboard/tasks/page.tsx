"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChartColumn, Clock3, ListTodo, Menu, Plus, Puzzle, Settings2, LayoutDashboard, AlertTriangle, CheckCircle2, SlidersHorizontal } from "lucide-react";
import TaskListView from "@/components/tasks/TaskListView";
import TaskKanbanView from "@/components/tasks/TaskKanbanView";
import TaskModal from "@/components/tasks/TaskModal";
import ViewToggle from "@/components/tasks/ViewToggle";
import { sampleTasks } from "@/data/tasks";
import { Task } from "@/types/task";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Tasks", icon: ListTodo, href: "/dashboard/tasks" },
  { label: "Calendar", icon: CalendarDays, href: "/dashboard/tasks?filter=calendar" },
  { label: "Analytics", icon: ChartColumn, href: "/dashboard/tasks?filter=analytics" },
  { label: "Integrations", icon: Puzzle, href: "/dashboard/tasks?filter=integrations" },
  { label: "Settings", icon: Settings2, href: "/dashboard/tasks?filter=settings" },
];

export default function TasksPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [sortBy, setSortBy] = useState("Due Date");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

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

  const handleAddTask = (task: Task) => {
    setTasks((prev) => [{ ...task, id: Date.now().toString() }, ...prev]);
    setModalOpen(false);
  };

  const handleEditTask = (updated: Task) => {
    setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
    setEditingTask(null);
    setModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setEditingTask(null);
    setModalOpen(false);
  };

  const handleStatusChange = (id: string, status: Task["status"]) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
  };

  const visibleTasks = useMemo(() => {
    let next = [...tasks];

    if (priorityFilter !== "All Priorities") {
      next = next.filter((task) => task.priority === priorityFilter);
    }

    if (search.trim()) {
      const needle = search.toLowerCase();
      next = next.filter((task) => `${task.title} ${task.description} ${task.tags.join(" ")}`.toLowerCase().includes(needle));
    }

    if (sortBy === "Priority") {
      const order = { High: 0, Medium: 1, Low: 2 };
      next.sort((a, b) => order[a.priority] - order[b.priority]);
    }

    return next;
  }, [tasks, priorityFilter, search, sortBy]);

  const stats = useMemo(() => {
    const dueToday = visibleTasks.filter((task) => task.dueDate.toLowerCase().includes("today")).length;
    const completed = visibleTasks.filter((task) => task.status === "Completed").length;
    const overdue = visibleTasks.filter((task) => task.status !== "Completed" && task.dueDate.toLowerCase().includes("oct")).length;

    return [
      { label: "Active Tasks", value: visibleTasks.length, hint: "+12%", icon: ListTodo, accent: isDark ? "text-[#9b8dff]" : "text-[#2563eb]" },
      { label: "Due Today", value: dueToday, hint: "Today", icon: Clock3, accent: "text-amber-500" },
      { label: "Overdue", value: overdue, hint: "Critical", icon: AlertTriangle, accent: "text-rose-500" },
      { label: "Completed", value: completed, hint: "Weekly", icon: CheckCircle2, accent: "text-cyan-500" },
    ];
  }, [visibleTasks, isDark]);

  return (
    <div className={isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"}>
      <aside className={`fixed left-0 top-0 z-30 hidden h-screen w-20 flex-col border-r px-3 py-5 md:flex lg:w-60 lg:px-4 ${isDark ? "border-white/5 bg-[#0d0d0f]" : "border-slate-200 bg-white"}`}>
        <Link href="/" className="flex items-center gap-3 px-1">
          <span className={`grid size-10 place-items-center rounded-2xl text-sm font-semibold ${isDark ? "bg-[#7c6ff7] text-white" : "bg-[#2563eb] text-white"}`}>F</span>
          <span className="hidden text-lg font-semibold tracking-[-0.05em] lg:inline">FlowAI</span>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = item.label === "Tasks";

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left ${active ? (isDark ? "bg-white/8 text-zinc-100" : "bg-slate-100 text-slate-900") : isDark ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
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
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-200 pb-3 dark:border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className={`inline-flex size-10 items-center justify-center rounded-full border md:hidden ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
              >
                <Menu size={16} />
              </button>
              <h1 className="text-xl font-semibold tracking-[-0.03em]">Tasks</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden lg:block">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Quick search tasks..."
                  className="w-44 rounded-full border border-slate-200 bg-slate-50 px-8 py-1.5 text-xs outline-none dark:border-white/10 dark:bg-white/5"
                />
                <span className="pointer-events-none absolute left-3 top-1.5 text-xs text-slate-400">⌕</span>
              </div>
              <ThemeToggle compact />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <select
              value={filter}
              onChange={(event) => handleFilterChange(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-white/10 dark:bg-[#16161a]"
              aria-label="Status filter"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="backlog">Backlog</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-white/10 dark:bg-[#16161a]"
              aria-label="Priority filter"
            >
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-white/10 dark:bg-[#16161a]"
              aria-label="Sort tasks"
            >
              <option>Due Date</option>
              <option>Priority</option>
            </select>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-[#16161a]"
              aria-label="More filters"
            >
              <SlidersHorizontal size={14} />
            </button>
            <ViewToggle view={view} onChange={setView} />
            <button
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
              className="add-task-btn flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>

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

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {view === "list" ? (
                <TaskListView
                  tasks={visibleTasks}
                  activeFilter={filter}
                  onFilterChange={handleFilterChange}
                  onEditTask={(task) => {
                    setEditingTask(task);
                    setModalOpen(true);
                  }}
                  onDeleteTask={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <TaskKanbanView
                  tasks={visibleTasks}
                  onAdd={(status) => {
                    setEditingTask({
                      id: "",
                      title: "",
                      description: "",
                      priority: "Medium",
                      status,
                      dueDate: "",
                      assignee: "MK",
                      tags: [],
                    });
                    setModalOpen(true);
                  }}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={(task) => {
          if (editingTask?.id) {
            handleEditTask(task);
            return;
          }
          handleAddTask(task);
        }}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
