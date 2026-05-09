"use client";

import { Clock, Globe } from "lucide-react";
import DayPill from "@/components/ui/DayPill";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SkeletonRow from "@/components/ui/SkeletonRow";
import type { WorkingHoursPrefs } from "@/lib/userPreferences";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Props = {
  isLoading: boolean;
  values: WorkingHoursPrefs;
  onChange: (patch: Partial<WorkingHoursPrefs>) => void;
};

export default function WorkingHoursSection({ isLoading, values, onChange }: Props) {
  const inputWrap =
    "relative flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#16161a]";
  const timeInput =
    "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5";

  const toggleDay = (day: string) => {
    const next = values.activeDays.includes(day)
      ? values.activeDays.filter((d) => d !== day)
      : [...values.activeDays, day];
    onChange({ activeDays: next });
  };

  const autoDetectTimezone = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) onChange({ timezone: tz });
  };

  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Working Hours</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Schedule boundaries</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Help FlowAI respect your focus time.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Time range */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className={inputWrap}>
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Clock className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">Start</span>
              </div>
              <input
                type="time"
                value={values.start}
                onChange={(e) => onChange({ start: e.target.value })}
                className={timeInput}
              />
            </div>
            <div className={inputWrap}>
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Clock className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">End</span>
              </div>
              <input
                type="time"
                value={values.end}
                onChange={(e) => onChange({ end: e.target.value })}
                className={timeInput}
              />
            </div>
          </div>

          {/* Active days */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Active days</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <DayPill
                  key={d}
                  label={d}
                  active={values.activeDays.includes(d)}
                  onClick={() => toggleDay(d)}
                />
              ))}
            </div>
          </div>

          {/* Pause toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
            <div>
              <p className="text-sm font-medium">Pause notifications outside working hours</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Silence reminders when you're off the clock.</p>
            </div>
            <ToggleSwitch
              checked={values.pauseOutside}
              onChange={(next) => onChange({ pauseOutside: next })}
              label="Pause notifications outside working hours"
            />
          </div>

          {/* Timezone */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
              <Globe className="size-4" />
              <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">Timezone</span>
            </div>
            <select
              value={values.timezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            >
              <optgroup label="Asia">
                <option value="Asia/Karachi">Asia/Karachi (PKT +5)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                <option value="Asia/Almaty">Asia/Almaty (UTC +6)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT +8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST +9)</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
              </optgroup>
              <optgroup label="Americas">
                <option value="America/New_York">America/New_York (ET)</option>
                <option value="America/Chicago">America/Chicago (CT)</option>
                <option value="America/Denver">America/Denver (MT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
              </optgroup>
            </select>
            <button
              type="button"
              onClick={autoDetectTimezone}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
            >
              Auto-detect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
