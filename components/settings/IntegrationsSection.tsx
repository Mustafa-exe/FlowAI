"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Loader2, RefreshCw, Zap } from "lucide-react";
import { useState } from "react";
import SkeletonRow from "@/components/ui/SkeletonRow";
import { useAuth } from "@/components/auth-provider";
import { verifyCalendarAccess, createCalendarEvent } from "@/lib/googleCalendar";
import type { IntegrationPrefs } from "@/lib/userPreferences";

const CATALOG = [
  { name: "Google Calendar", description: "Sync tasks as events in real time", isReal: true },
  { name: "Notion",          description: "Import tasks from Notion databases",      isReal: false },
  { name: "Slack",           description: "Receive FlowAI alerts in Slack channels", isReal: false },
  { name: "GitHub",          description: "Link commits and PRs to tasks",           isReal: false },
  { name: "Linear",          description: "Two-way sync with Linear issues",         isReal: false },
] as const;

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
      connected
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-zinc-400"
    }`}>
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

function AppLogo({ name }: { name: string }) {
  if (name === "Google Calendar") {
    return (
      <span className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      </span>
    );
  }
  const initials = name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  return (
    <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-zinc-300">
      {initials}
    </span>
  );
}

type Props = {
  isLoading: boolean;
  values: IntegrationPrefs;
  onChange: (patch: IntegrationPrefs) => void;
};

export default function IntegrationsSection({ isLoading, values, onChange }: Props) {
  const { connectGoogleCalendar, disconnectGoogleCalendar, isGCalConnected, getGCalToken } = useAuth();
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalError, setGcalError] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const connectedCount = CATALOG.filter(({ name }) =>
    name === "Google Calendar" ? isGCalConnected : (values[name] ?? false)
  ).length;

  const handleGoogleCalendar = async (currentlyConnected: boolean) => {
    setGcalError("");
    setTestResult(null);
    setGcalLoading(true);
    try {
      if (currentlyConnected) {
        await disconnectGoogleCalendar();
        onChange({ ...values, "Google Calendar": false });
      } else {
        await connectGoogleCalendar();
        onChange({ ...values, "Google Calendar": true });
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
        return;
      }

      // Verify access first
      const ok = await verifyCalendarAccess(token);
      if (!ok) {
        setGcalError("Cannot reach Google Calendar. Make sure the Calendar API is enabled in Google Cloud Console.");
        return;
      }

      // Create a test event
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const dueDate = tomorrow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"

      await createCalendarEvent(token, {
        title: "FlowAI Test Event",
        description: "This is a test event created by FlowAI to verify the Google Calendar integration.",
        dueDate,
        priority: "Medium",
      });

      setTestResult("success");
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("403") || msg.includes("disabled")) {
        setGcalError(
          "Google Calendar API is not enabled. Enable it at: console.cloud.google.com → APIs & Services → Enable APIs → search 'Google Calendar API' → Enable"
        );
      } else if (msg.includes("401")) {
        setGcalError("Token expired. Please disconnect and reconnect Google Calendar.");
      } else {
        setGcalError(`Sync failed: ${msg}`);
      }
      setTestResult("error");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Integrations</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Connected apps</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Connect your tools to keep work flowing.</p>
      </div>

      {/* Connected apps summary */}
      {!isLoading && connectedCount > 0 && (
        <div className={`mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
          "border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/15 dark:bg-emerald-500/8"
        }`}>
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {connectedCount} app{connectedCount !== 1 ? "s" : ""} connected
            {isGCalConnected ? " — tasks sync to Google Calendar automatically" : ""}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-3">
          {CATALOG.map(({ name, description, isReal }) => {
            const isGCal = name === "Google Calendar";
            const connected = isGCal ? isGCalConnected : (values[name] ?? false);

            return (
              <motion.div
                key={name}
                whileHover={{ scale: 1.003 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col gap-2 rounded-2xl border px-4 py-4 transition ${
                  connected
                    ? "border-emerald-500/20 bg-emerald-500/3 dark:border-emerald-500/15 dark:bg-emerald-500/5"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#16161a] dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AppLogo name={name} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{name}</p>
                        {isReal && (
                          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">{description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge connected={connected} />
                    <button
                      type="button"
                      disabled={isGCal && gcalLoading}
                      onClick={() => {
                        if (isGCal) {
                          handleGoogleCalendar(connected);
                        } else {
                          onChange({ ...values, [name]: !connected });
                        }
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
                        connected
                          ? "border border-rose-500/30 bg-white text-rose-500 hover:bg-rose-500/5 dark:bg-transparent"
                          : "bg-[var(--color-accent)] text-white hover:opacity-90"
                      }`}
                    >
                      {isGCal && gcalLoading && <Loader2 className="size-3.5 animate-spin" />}
                      {connected ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                </div>

                {/* Google Calendar connected state */}
                {isGCal && connected && (
                  <div className="ml-[52px] space-y-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <Zap className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            Auto-sync active
                          </p>
                          <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-500/80">
                            New FlowAI tasks are added to your primary Google Calendar with priority color coding (red = High, yellow = Medium, green = Low)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Test sync button */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTestSync}
                        disabled={testLoading}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                      >
                        {testLoading
                          ? <Loader2 className="size-3 animate-spin" />
                          : <RefreshCw className="size-3" />}
                        Test sync
                      </button>

                      <a
                        href="https://calendar.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300"
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
                  </div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {isGCal && gcalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="ml-[52px] rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2"
                    >
                      <p className="text-xs text-red-600 dark:text-red-400">{gcalError}</p>
                      {gcalError.includes("not enabled") && (
                        <a
                          href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Enable Google Calendar API
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
