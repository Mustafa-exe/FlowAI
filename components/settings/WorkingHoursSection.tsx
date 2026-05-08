"use client";

import { Clock, Globe } from "lucide-react";
import { useState } from "react";
import DayPill from "@/components/ui/DayPill";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SkeletonRow from "@/components/ui/SkeletonRow";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function WorkingHoursSection({ isLoading, onDirty }: { isLoading: boolean; onDirty: () => void }) {
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("18:00");
  const [activeDays, setActiveDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [pauseOutside, setPauseOutside] = useState(true);
  const [timezone, setTimezone] = useState("Asia/Karachi");

  const inputWrap =
    "relative flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#16161a]";
  const timeInput =
    "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5";

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
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className={inputWrap}>
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Clock className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">Start</span>
              </div>
              <input
                type="time"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  onDirty();
                }}
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
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  onDirty();
                }}
                className={timeInput}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Active days</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {days.map((d) => (
                <DayPill
                  key={d}
                  label={d}
                  active={activeDays.includes(d)}
                  onClick={() => {
                    setActiveDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
                    onDirty();
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
            <div>
              <p className="text-sm font-medium">Pause notifications outside working hours</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Silence reminders when you’re off the clock.</p>
            </div>
            <ToggleSwitch
              checked={pauseOutside}
              onChange={(next) => {
                setPauseOutside(next);
                onDirty();
              }}
              label="Pause notifications outside working hours"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
              <Globe className="size-4" />
              <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">Timezone</span>
            </div>
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                onDirty();
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            >
              <optgroup label="Asia">
                <option value="Asia/Karachi">Asia/Karachi (PKT +5)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                <option value="Asia/Almaty">Asia/Almaty (UTC +6)</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
              </optgroup>
            </select>
            <button
              type="button"
              onClick={() => {
                setTimezone("Asia/Karachi");
                onDirty();
              }}
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

