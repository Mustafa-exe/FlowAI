"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lock, Monitor, ShieldCheck, Upload, X } from "lucide-react";
import { useState } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SkeletonRow from "@/components/ui/SkeletonRow";
import { useAuth } from "@/components/auth-provider";
import type { SecurityPrefs } from "@/lib/userPreferences";

// Sessions are derived from Firebase Auth metadata — not hardcoded
function useActiveSessions() {
  const { user } = useAuth();
  if (!user) return [];

  const sessions = [];

  // Current session — always present
  sessions.push({
    id: "current",
    device: "This device",
    browser: typeof navigator !== "undefined" ? getBrowserName(navigator.userAgent) : "Browser",
    lastActive: "Active now",
  });

  // If the user has a creation time different from last sign-in, show a second entry
  const created = user.metadata?.creationTime;
  const lastSignIn = user.metadata?.lastSignInTime;
  if (created && lastSignIn && created !== lastSignIn) {
    sessions.push({
      id: "previous",
      device: "Previous session",
      browser: "Unknown",
      lastActive: `Last signed in: ${new Date(lastSignIn).toLocaleDateString()}`,
    });
  }

  return sessions;
}

function getBrowserName(ua: string): string {
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/")) return "Safari";
  return "Browser";
}

type Props = {
  isLoading: boolean;
  values: SecurityPrefs;
  onChange: (patch: Partial<SecurityPrefs>) => void;
};

export default function SecuritySection({ isLoading, values, onChange }: Props) {
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const sessions = useActiveSessions();

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === "google.com") ?? false;

  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Privacy & Security</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Account protection</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Secure access and manage your active sessions.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Password row */}
          {isGoogleUser ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
              <div className="flex items-center gap-3">
                <Lock className="size-5 text-slate-400 dark:text-zinc-500" />
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">Your account uses Google Sign-In — no password needed.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <svg className="size-3" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Managed by Google
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
              <div className="flex items-center gap-3">
                <Lock className="size-5 text-slate-400 dark:text-zinc-500" />
                <div>
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">
                    {user?.metadata?.lastSignInTime
                      ? `Last signed in: ${new Date(user.metadata.lastSignInTime).toLocaleDateString()}`
                      : "Update your account password"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
              >
                Update
              </button>
            </div>
          )}

          {/* 2FA — stored in Firestore */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-slate-400 dark:text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Secure your account with 2FA</p>
              </div>
            </div>
            <ToggleSwitch
              checked={values.twoFA}
              onChange={(next) => onChange({ twoFA: next })}
              label="Two-factor authentication"
            />
          </div>

          {/* Active sessions — derived from Firebase Auth metadata */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#16161a]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Active sessions</p>
            <div className="mt-3 space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="size-4 text-slate-400 dark:text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">{s.device} · {s.browser}</p>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">{s.lastActive}</p>
                    </div>
                  </div>
                  {s.id !== "current" && (
                    <button type="button" className="text-sm font-medium text-rose-500 hover:text-rose-600">
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
          >
            <Upload className="size-4" />
            Export all my data
          </button>

          {/* Danger zone */}
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-rose-500">Delete Account</p>
                <p className="text-sm text-slate-600 dark:text-zinc-400">Permanently deletes all data. Cannot be undone.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      <AnimatePresence>
        {showDeleteModal ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161a]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Danger Zone</p>
                  <h3 className="mt-2 text-lg font-semibold">Are you sure?</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    This will permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close modal"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  Yes, delete my account
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
