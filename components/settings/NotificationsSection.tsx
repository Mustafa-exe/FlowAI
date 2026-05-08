"use client";

import { BarChart2, Bell, Clock, Smartphone, Sparkles } from "lucide-react";
import { useState } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SkeletonRow from "@/components/ui/SkeletonRow";

const initial = [
  { icon: Bell, label: "Email Notifications", description: "Receive task updates via email", enabled: true },
  { icon: Smartphone, label: "Push Notifications", description: "Browser and mobile alerts for deadlines", enabled: true },
  { icon: BarChart2, label: "Weekly Digest", description: "Every Monday: your week in review", enabled: false },
  { icon: Clock, label: "Task Reminders", description: "Alerts before deadlines based on priority", enabled: true },
] as const;

export default function NotificationsSection({ isLoading, onDirty }: { isLoading: boolean; onDirty: () => void }) {
  const [items, setItems] = useState(initial);
  const [summaryTime, setSummaryTime] = useState("07:00");

  const rowClass =
    "flex h-16 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#16161a] dark:hover:bg-white/5";

  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Notifications</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Alerts & summaries</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Control how and when FlowAI notifies you.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={rowClass}>
                <div className="flex items-center gap-3">
                  <Icon className="size-5 text-slate-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">{item.description}</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={item.enabled}
                  onChange={(next) => {
                    setItems((prev) => prev.map((p) => (p.label === item.label ? { ...p, enabled: next } : p)));
                    onDirty();
                  }}
                  label={item.label}
                />
              </div>
            );
          })}

          <div className={rowClass}>
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-slate-400 dark:text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Daily AI Summary</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Delivered each morning</p>
              </div>
            </div>
            <input
              type="time"
              value={summaryTime}
              onChange={(e) => {
                setSummaryTime(e.target.value);
                onDirty();
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              aria-label="Daily AI summary time"
            />
          </div>
        </div>
      )}
    </div>
  );
}

