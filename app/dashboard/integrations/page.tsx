"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/components/auth-provider";
import { verifyCalendarAccess, createCalendarEvent } from "@/lib/googleCalendar";

export default function IntegrationsPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const { connectGoogleCalendar, disconnectGoogleCalendar, isGCalConnected, getGCalToken } = useAuth();

  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalError, setGcalError] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleGoogleCalendar = async () => {
    setGcalError("");
    setTestResult(null);
    setGcalLoading(true);
    try {
      if (isGCalConnected) {
        await disconnectGoogleCalendar();
      } else {
        await connectGoogleCalendar();
      }
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("popup-closed") || msg.includes("cancelled")) {
        setGcalError("Sign-in was cancelled.");
      } else if (msg.includes("popup-blocked")) {
        setGcalError("Popup was blocked. Please allow popups for this site.");
      } else {
        setGcalError("Failed to connect. Please try again.");
      }
    } finally {
      setGcalLoading(false);
    }
  };

  const handleTestSync = async () => {
    setTestLoading(true);
    setTestResult(null);
    setGcalError("");
    try {
      const token = await getGCalToken();
      if (!token) {
        setGcalError("No valid token. Please reconnect Google Calendar.");
        setTestResult("error");
        return;
      }
      const ok = await verifyCalendarAccess(token);
      if (!ok) {
        setGcalError("Cannot reach Google Calendar. Make sure the Calendar API is enabled.");
        setTestResult("error");
        return;
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      await createCalendarEvent(token, {
        title: "FlowAI Test Event",
        description: "Test event created by FlowAI to verify the Google Calendar integration.",
        dueDate: tomorrow.toISOString().slice(0, 16),
        priority: "Medium",
      });
      setTestResult("success");
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("403") || msg.includes("disabled")) {
        setGcalError("Google Calendar API is not enabled. Enable it in Google Cloud Console.");
      } else if (msg.includes("401")) {
        setGcalError("Token expired. Please disconnect and reconnect.");
      } else {
        setGcalError(`Sync failed: ${msg}`);
      }
      setTestResult("error");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className={isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"}>
      <DashboardSidebar />

      <div className="md:pl-[72px] lg:pl-60">
        {/* Top bar */}
        <div className={`sticky top-0 z-20 border-b backdrop-blur ${isDark ? "border-white/10 bg-[#111114]/85" : "border-slate-200 bg-white/85"}`}>
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>Integrations</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Connected Apps</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white"}`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Google Calendar logo */}
                <span className="grid size-12 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                  <svg className="size-6" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">Google Calendar</p>
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">Live</span>
                  </div>
                  <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    Sync FlowAI tasks as calendar events automatically
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isGCalConnected
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isDark ? "bg-white/10 text-zinc-400" : "bg-slate-100 text-slate-500"
                }`}>
                  {isGCalConnected ? "Connected" : "Not connected"}
                </span>

                <button
                  type="button"
                  disabled={gcalLoading}
                  onClick={handleGoogleCalendar}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
                    isGCalConnected
                      ? "border border-rose-500/30 bg-white text-rose-500 hover:bg-rose-50 dark:bg-transparent dark:hover:bg-rose-500/10"
                      : "bg-[var(--color-accent)] text-white hover:opacity-90"
                  }`}
                >
                  {gcalLoading && <Loader2 className="size-3.5 animate-spin" />}
                  {isGCalConnected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>

            {/* Connected state details */}
            <AnimatePresence>
              {isGCalConnected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 space-y-3 overflow-hidden"
                >
                  {/* Auto-sync info */}
                  <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}>
                    <div className="flex items-start gap-2">
                      <Zap className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Auto-sync active</p>
                        <p className={`mt-0.5 text-xs ${isDark ? "text-emerald-500/80" : "text-emerald-600/80"}`}>
                          Tasks created via the AI chatbot are automatically added to your primary Google Calendar.
                          Color coded by priority: red = High, yellow = Medium, green = Low.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* What syncs */}
                  <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                    <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-slate-500"}`}>What syncs</p>
                    <ul className="space-y-1.5">
                      {[
                        { icon: CheckCircle2, text: "Tasks created by AI chatbot → Google Calendar events" },
                        { icon: CalendarDays, text: "Due date becomes event start time (1-hour block)" },
                        { icon: Zap,          text: "Priority color coding applied automatically" },
                      ].map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-2 text-xs">
                          <Icon className={`size-3.5 shrink-0 ${isDark ? "text-zinc-400" : "text-slate-500"}`} />
                          <span className={isDark ? "text-zinc-300" : "text-slate-600"}>{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTestSync}
                      disabled={testLoading}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                        isDark
                          ? "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {testLoading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                      Test sync
                    </button>

                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs transition ${isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      Open Google Calendar
                      <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <AnimatePresence>
                    {testResult === "success" && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
                      >
                        ✓ Test event created — check your Google Calendar for "FlowAI Test Event"
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {gcalError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2"
                >
                  <p className="text-xs text-red-600 dark:text-red-400">{gcalError}</p>
                  {gcalError.includes("not enabled") && (
                    <a
                      href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Enable Google Calendar API <ExternalLink className="size-3" />
                    </a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
