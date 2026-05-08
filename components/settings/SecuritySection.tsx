"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lock, Monitor, ShieldCheck, Upload, X } from "lucide-react";
import { useState } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SkeletonRow from "@/components/ui/SkeletonRow";

const sessions = [
  { id: "s1", device: "MacBook Pro", browser: "Chrome", lastActive: "Active now · Islamabad, PK" },
  { id: "s2", device: "iPhone 15", browser: "Safari", lastActive: "2 days ago · Lahore, PK" },
] as const;

export default function SecuritySection({ isLoading, onDirty }: { isLoading: boolean; onDirty: () => void }) {
  const [twoFA, setTwoFA] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
            <div className="flex items-center gap-3">
              <Lock className="size-5 text-slate-400 dark:text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Change Password</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Last changed 3 months ago</p>
              </div>
            </div>
            <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10">
              Update
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-slate-400 dark:text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Secure your account with 2FA</p>
              </div>
            </div>
            <ToggleSwitch
              checked={twoFA}
              onChange={(next) => {
                setTwoFA(next);
                onDirty();
              }}
              label="Two-factor authentication"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#16161a]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Active sessions</p>
            <div className="mt-3 space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Monitor className="size-4 text-slate-400 dark:text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {s.device} · {s.browser}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">{s.lastActive}</p>
                    </div>
                  </div>
                  <button type="button" className="text-sm font-medium text-rose-500">
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10">
            <Upload className="size-4" />
            Export all my data
          </button>

          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-rose-500">Delete Account</p>
                <p className="text-sm text-slate-600 dark:text-zinc-400">Permanently deletes all data. Cannot be undone.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showDeleteModal ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">This action cannot be undone.</p>
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
                  onClick={() => {
                    setShowDeleteModal(false);
                    onDirty();
                  }}
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white"
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

