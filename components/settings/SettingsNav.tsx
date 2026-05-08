"use client";

import { Bell, Brush, Clock, KeyRound, Link2, SlidersHorizontal, User2 } from "lucide-react";

const items = [
  { id: "general", label: "General", icon: User2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "working-hours", label: "Working Hours", icon: Clock },
  { id: "appearance", label: "Appearance", icon: Brush },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "security", label: "Privacy & Security", icon: KeyRound },
] as const;

export default function SettingsNav() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#16161a]">
      <div className="flex items-center justify-between px-2 pb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Categories</p>
        <SlidersHorizontal className="size-4 text-slate-400 dark:text-zinc-500" />
      </div>
      <div className="space-y-1">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <label key={item.id} className="settings-nav-item block cursor-pointer rounded-xl">
              <input
                type="radio"
                name="settings-category"
                className="sr-only"
                defaultChecked={idx === 0}
                onChange={() => {
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-zinc-300">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

