"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useThemeMode } from "@/components/theme-provider";

export default function ForgotPasswordPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        // Don't reveal whether email exists — security best practice
        setSent(true);
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
    isDark
      ? "border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 focus:border-[var(--color-accent)]"
      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-accent)]"
  }`;

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 ${isDark ? "bg-[#0d0d0f]" : "bg-[#f8fafc]"}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-[var(--color-accent)] text-sm font-semibold text-white">F</span>
            <span className={`text-xl font-semibold tracking-[-0.05em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>FlowAI</span>
          </Link>
          <h1 className={`mt-6 text-2xl font-semibold tracking-[-0.04em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
            Reset your password
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white shadow-sm"}`}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4 text-center"
              >
                <div className="grid size-14 place-items-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="size-7 text-emerald-500" />
                </div>
                <p className={`text-sm font-semibold ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
                  Check your inbox
                </p>
                <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
                </p>
                <Link
                  href="/login"
                  className="mt-2 text-sm font-semibold text-[var(--color-accent)] hover:underline"
                >
                  Back to sign in
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      key="error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {!sent && (
          <p className={`mt-5 text-center text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-accent)] hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
