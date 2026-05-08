"use client";

import { Camera } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SegmentedControl from "@/components/ui/SegmentedControl";
import SkeletonRow from "@/components/ui/SkeletonRow";

export default function GeneralSection({ isLoading, onDirty }: { isLoading: boolean; onDirty: () => void }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Mustafa");
  const [email, setEmail] = useState("mustafa@flowai.com");
  const [language, setLanguage] = useState("English (US)");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5";

  const verifiedBadge = useMemo(
    () => (
      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        ✓ Verified
      </span>
    ),
    [],
  );

  useEffect(() => {
    // keep local state; no side effects
  }, []);

  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">General</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Profile & preferences</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Update your account basics and localization.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <label className="group relative grid size-20 cursor-pointer place-items-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 dark:border-white/15 dark:bg-white/5 dark:text-zinc-400">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setAvatarUrl(String(reader.result));
                    onDirty();
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar preview" className="size-20 rounded-full object-cover" />
              ) : (
                <div className="grid place-items-center gap-1">
                  <Camera className="size-5" />
                  <span className="text-[11px] font-semibold">Upload photo</span>
                </div>
              )}
            </label>

            <div className="min-w-[240px] flex-1">
              <p className="text-sm font-semibold">Profile photo</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">A clear avatar helps teammates recognize you.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Display name</p>
              <input
                className={`${inputClass} mt-2`}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  onDirty();
                }}
                placeholder="Display name"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Email</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  className={inputClass}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    onDirty();
                  }}
                  type="email"
                />
                {verifiedBadge}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Language</p>
              <select
                className={`${inputClass} mt-2`}
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  onDirty();
                }}
              >
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Deutsch</option>
                <option>Español</option>
              </select>
            </div>
            <div className="pt-1">
              <SegmentedControl
                label="Date format"
                value={dateFormat}
                onChange={(v) => {
                  setDateFormat(v);
                  onDirty();
                }}
                options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

