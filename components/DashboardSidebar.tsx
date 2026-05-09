"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, ChartColumn, ChevronLeft, ChevronRight,
  LayoutDashboard, ListTodo, LogOut, MessageSquareText,
  Puzzle, RepeatIcon, Settings2, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useThemeMode } from "@/components/theme-provider";

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/dashboard",                    icon: LayoutDashboard },
  { label: "Tasks",        href: "/dashboard/tasks",              icon: ListTodo },
  { label: "Recurring",    href: "/dashboard/tasks/recurring",    icon: RepeatIcon },
  { label: "Calendar",     href: "/dashboard/calendar",           icon: CalendarDays },
  { label: "Chat",         href: "/dashboard/chat",               icon: MessageSquareText },
  { label: "Analytics",    href: "/dashboard/analytics",          icon: ChartColumn },
  { label: "Integrations", href: "/dashboard/integrations",       icon: Puzzle },
  { label: "Settings",     href: "/settings",                     icon: Settings2 },
];

const COLLAPSED_KEY = "flowai-sidebar-collapsed";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { theme } = useThemeMode();
  const isDark = theme === "dark";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSED_KEY, String(!c));
      return !c;
    });
  };

  const handleSignOut = async () => {
    await signOutUser();
    router.replace("/login");
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  const sidebarBg = isDark ? "bg-[#0d0d0f] border-white/5" : "bg-white border-slate-200";
  const activeClass = isDark ? "bg-white/8 text-zinc-100" : "bg-slate-100 text-slate-900";
  const inactiveClass = isDark
    ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900";
  const activeIconClass = isDark ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]";
  const inactiveIconClass = isDark ? "bg-white/5 text-zinc-300" : "bg-slate-100 text-slate-500";

  const sidebarWidth = collapsed ? "w-[72px]" : "w-60";

  const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-1 ${collapsed ? "justify-center" : ""}`}>
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--color-accent)] text-sm font-semibold text-white">
            F
          </span>
          {!collapsed && (
            <span className={`text-lg font-semibold tracking-[-0.05em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
              FlowAI
            </span>
          )}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onItemClick}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${collapsed ? "justify-center" : ""} ${active ? activeClass : inactiveClass}`}
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl transition ${active ? activeIconClass : inactiveIconClass}`}>
                <Icon className="size-4" />
              </span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className={`rounded-[1.35rem] border p-3 ${isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent)]/10 text-sm font-semibold text-[var(--color-accent)]`}>
            {initials}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className={`text-xs ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                {user?.email?.split("@")[0] ?? ""}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            isDark
              ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed left-0 top-0 z-30 hidden h-screen flex-col border-r px-3 py-5 md:flex lg:px-4 ${sidebarBg}`}
      >
        <NavContent />

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`absolute -right-3 top-20 grid size-6 place-items-center rounded-full border shadow-sm transition ${
            isDark ? "border-white/10 bg-[#16161a] text-zinc-400 hover:text-zinc-100" : "border-slate-200 bg-white text-slate-400 hover:text-slate-700"
          }`}
        >
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
        </button>
      </motion.aside>

      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`fixed left-4 top-4 z-40 grid size-10 place-items-center rounded-full border shadow-sm md:hidden ${
          isDark ? "border-white/10 bg-[#0d0d0f] text-zinc-100" : "border-slate-200 bg-white text-slate-900"
        }`}
        aria-label="Open navigation"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r px-4 py-5 md:hidden ${sidebarBg}`}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full ${isDark ? "text-zinc-400 hover:bg-white/10" : "text-slate-400 hover:bg-slate-100"}`}
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
              <NavContent onItemClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/** Returns the correct left padding class based on sidebar state */
export function useSidebarPadding() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    setCollapsed(stored === "true");
    const handler = () => setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "true");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return collapsed ? "md:pl-[72px]" : "md:pl-60";
}
