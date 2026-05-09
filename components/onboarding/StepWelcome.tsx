"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UsernameState = "idle" | "checking" | "available" | "taken";

async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "usernames"),
      where("username", "==", username.toLowerCase())
    );
    const snap = await getDocs(q);
    return snap.empty; // true = available
  } catch {
    return true; // fail open — don't block the user
  }
}

export default function StepWelcome({
  formData,
  errors,
  dispatchForm,
  dispatchError,
  onNext,
}: {
  formData: { name: string; username: string; avatar: string | null };
  errors: Record<string, string>;
  dispatchForm: React.Dispatch<{ type: string; [key: string]: any }>;
  dispatchError: React.Dispatch<{ field: string; error: string }>;
  onNext: () => void;
}) {
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const timerRef = useRef<number | null>(null);

  const validateName = () => {
    if (!formData.name.trim()) {
      dispatchError({ field: "name", error: "Please enter your full name." });
      return false;
    }
    dispatchError({ field: "name", error: "" });
    return true;
  };

  const validateUsername = () => {
    if (!formData.username.trim()) {
      dispatchError({ field: "username", error: "Please choose a username." });
      return false;
    }
    if (usernameState === "taken") {
      dispatchError({ field: "username", error: "That username is already taken." });
      return false;
    }
    if (usernameState === "checking") {
      dispatchError({ field: "username", error: "Still checking availability…" });
      return false;
    }
    dispatchError({ field: "username", error: "" });
    return true;
  };

  const checkUsername = (value: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!value.trim()) { setUsernameState("idle"); return; }
    setUsernameState("checking");
    timerRef.current = window.setTimeout(async () => {
      const available = await checkUsernameAvailability(value.trim());
      setUsernameState(available ? "available" : "taken");
    }, 500);
  };

  const handleContinue = () => {
    const ok = validateName() && validateUsername();
    if (ok) onNext();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-[#111114]">
      <h2 className="text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.05em]">Welcome to FlowAI</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Let&apos;s set up your workspace in under 2 minutes</p>

      <div className="mt-7 space-y-5">
        {/* Avatar */}
        <label className="mx-auto grid size-20 cursor-pointer place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 dark:border-white/15 dark:bg-white/5 dark:text-zinc-400">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => dispatchForm({ type: "SET_FIELD", field: "avatar", value: String(reader.result) });
              reader.readAsDataURL(file);
            }}
          />
          {formData.avatar
            ? <img src={formData.avatar} alt="Avatar preview" className="size-20 rounded-2xl object-cover" />
            : <Camera className="size-6" />}
        </label>

        {/* Full name */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Full name</p>
          <input
            value={formData.name}
            onChange={(e) => dispatchForm({ type: "SET_FIELD", field: "name", value: e.target.value })}
            onBlur={validateName}
            placeholder="Jane Doe"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5"
          />
          <AnimatePresence>
            {errors.name && (
              <motion.p key="name-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1 text-sm text-red-500">
                {errors.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Username */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Username</p>
            <span className="text-xs">
              {usernameState === "checking" && (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-500">
                  <Loader2 className="size-3 animate-spin" /> checking
                </span>
              )}
              {usernameState === "available" && (
                <span className="inline-flex items-center gap-1 text-emerald-500">
                  <Check className="size-3" /> Available
                </span>
              )}
              {usernameState === "taken" && (
                <span className="inline-flex items-center gap-1 text-red-500">
                  <X className="size-3" /> Already taken
                </span>
              )}
            </span>
          </div>
          <input
            value={formData.username}
            onChange={(e) => {
              dispatchForm({ type: "SET_FIELD", field: "username", value: e.target.value });
              checkUsername(e.target.value);
            }}
            onBlur={validateUsername}
            placeholder="@janedoe"
            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] dark:bg-white/5 ${
              usernameState === "taken"
                ? "border-red-500/50"
                : usernameState === "available"
                  ? "border-emerald-500/50"
                  : "border-slate-200 dark:border-white/10"
            }`}
          />
          <AnimatePresence>
            {errors.username && (
              <motion.p key="username-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1 text-sm text-red-500">
                {errors.username}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onNext}
          className="text-sm text-slate-500 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Skip for now
        </button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleContinue}
          className="rounded-xl bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          Continue →
        </motion.button>
      </div>
    </div>
  );
}
