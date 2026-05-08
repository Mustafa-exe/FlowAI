"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import SkeletonRow from "@/components/ui/SkeletonRow";

const initialIntegrations = [
  { name: "Google Calendar", description: "Sync events and deadlines automatically", connected: true },
  { name: "Notion", description: "Import tasks from Notion databases", connected: false },
  { name: "Slack", description: "Receive FlowAI alerts in Slack channels", connected: true },
  { name: "GitHub", description: "Link commits and PRs to tasks", connected: false },
  { name: "Linear", description: "Two-way sync with Linear issues", connected: false },
] as const;

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
        connected
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400"
      }`}
    >
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

function AppLogo({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-zinc-300">
      {initials}
    </span>
  );
}

export default function IntegrationsSection({ isLoading, onDirty }: { isLoading: boolean; onDirty: () => void }) {
  const [apps, setApps] = useState(initialIntegrations);

  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Integrations</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Connected apps</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Connect your tools to keep work flowing.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <motion.div
              key={app.name}
              whileHover={{ scale: 1.005 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#16161a] dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <AppLogo name={app.name} />
                <div>
                  <p className="text-sm font-medium">{app.name}</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">{app.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge connected={app.connected} />
                <button
                  type="button"
                  onClick={() => {
                    setApps((prev) => prev.map((p) => (p.name === app.name ? { ...p, connected: !p.connected } : p)));
                    onDirty();
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    app.connected
                      ? "border border-rose-500/30 bg-white text-rose-500 hover:bg-rose-500/5 dark:bg-transparent"
                      : "bg-[var(--color-accent)] text-white"
                  }`}
                >
                  {app.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

