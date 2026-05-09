"use client";

import { Camera } from "lucide-react";
import { useMemo } from "react";
import SegmentedControl from "@/components/ui/SegmentedControl";
import SkeletonRow from "@/components/ui/SkeletonRow";
import { useAuth } from "@/components/auth-provider";
import type { GeneralPrefs } from "@/lib/userPreferences";

type Props = {
  isLoading: boolean;
  values: GeneralPrefs;
  onChange: (patch: Partial<GeneralPrefs>) => void;
};

export default function GeneralSection({ isLoading, values, onChange }: Props) {
  const { user } = useAuth();

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === "google.com") ?? false;
  const isEmailVerified = user?.emailVerified ?? false;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5";

  const verifiedBadge = useMemo(
    () => (
      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        ✓ Verified
      </span>
    ),
    [],
  );

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
          {/* Avatar */}
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
                  reader.onload = () => onChange({ avatarUrl: String(reader.result) });
                  reader.readAsDataURL(file);
                }}
              />
              {values.avatarUrl ? (
                <img src={values.avatarUrl} alt="Profile avatar" className="size-20 rounded-full object-cover" />
              ) : (
                <div className="grid place-items-center gap-1">
                  <Camera className="size-5" />
                  <span className="text-[11px] font-semibold">Upload photo</span>
                </div>
              )}
            </label>

            <div className="min-w-[200px] flex-1">
              <p className="text-sm font-semibold">Profile photo</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                {isGoogleUser ? "Synced from your Google account." : "A clear avatar helps teammates recognize you."}
              </p>
              {isGoogleUser && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <svg className="size-3" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google account
                </span>
              )}
            </div>
          </div>

          {/* Name + Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Display name</p>
              <input
                className={`${inputClass} mt-2`}
                value={values.displayName}
                onChange={(e) => onChange({ displayName: e.target.value })}
                placeholder="Display name"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Email</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  className={`${inputClass} ${isGoogleUser ? "cursor-not-allowed opacity-60" : ""}`}
                  value={user?.email ?? ""}
                  readOnly
                  type="email"
                  placeholder="you@example.com"
                />
                {(isEmailVerified || isGoogleUser) && verifiedBadge}
              </div>
              {isGoogleUser && (
                <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">Managed by Google</p>
              )}
            </div>
          </div>

          {/* Language + Date format */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Language</p>
              <select
                className={`${inputClass} mt-2`}
                value={values.language}
                onChange={(e) => onChange({ language: e.target.value })}
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
                value={values.dateFormat}
                onChange={(v) => onChange({ dateFormat: v })}
                options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
