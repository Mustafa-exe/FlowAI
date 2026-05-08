import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, ChartColumn, LayoutDashboard, ListTodo, MessageSquareText, Puzzle, Settings2 } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquareText },
  { label: "Analytics", href: "/dashboard", icon: ChartColumn },
  { label: "Integrations", href: "/dashboard", icon: Puzzle },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#111114] dark:text-zinc-100">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-20 flex-col border-r border-slate-200 bg-white px-3 py-5 dark:border-white/10 dark:bg-[#0d0d0f] md:flex lg:w-60 lg:px-4">
        <Link href="/" className="flex items-center gap-3 px-1">
          <span className="grid size-10 place-items-center rounded-2xl bg-[var(--color-accent)] text-sm font-semibold text-white">
            F
          </span>
          <span className="hidden text-lg font-semibold tracking-[-0.05em] lg:inline">FlowAI</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/settings";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  active
                    ? "bg-slate-100 text-slate-900 dark:bg-white/8 dark:text-zinc-100"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                }`}
              >
                <span
                  className={`grid size-9 place-items-center rounded-xl ${
                    active
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] dark:bg-[var(--color-accent)]/20"
                      : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-zinc-300"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="hidden text-sm font-medium lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-20 lg:pl-60">{children}</div>
    </div>
  );
}

