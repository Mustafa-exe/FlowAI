"use client";

import { Clock } from "lucide-react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SkeletonRow from "@/components/ui/SkeletonRow";
import type { NotificationPrefs } from "@/lib/userPreferences";

type Props = {
  isLoading: boolean;
  values: NotificationPrefs;
  onChange: (patch: Partial<NotificationPrefs>) => void;
};

export default function NotificationsSection({ isLoading, values, onChange }: Props) {
  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Notifications</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Alerts & summaries</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Control when FlowAI reminds you about deadlines.</p>
      </div>

      {isLoading ? (
        <SkeletonRow />
      ) : (
        <div className="flex h-16 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#16161a] dark:hover:bg-white/5">
          <div className="flex items-center gap-3">
            <Clock className="size-5 text-slate-400 dark:text-zinc-500" />
            <div>
              <p className="text-sm font-medium">Task Reminders</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Alerts before deadlines based on priority</p>
            </div>
          </div>
          <ToggleSwitch
            checked={values.taskReminders}
            onChange={(next) => onChange({ taskReminders: next })}
            label="Task Reminders"
          />
        </div>
      )}
    </div>
  );
}
