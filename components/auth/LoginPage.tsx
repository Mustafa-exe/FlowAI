"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { useThemeMode } from "@/components/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthReady, signInWithGoogle } = useAuth();
  const { theme } = useThemeMode();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthReady && user) {
      router.replace("/dashboard");
    }
  }, [isAuthReady, user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
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
            Welcome back
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
            Sign in to your workspace
          </p>
        </div>

        <div className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white shadow-sm"}`}>
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className={`flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-60 ${
              isDark
                ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleLoading ? "Signing in…" : "Continue with Google"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
            <span className={`text-xs ${isDark ? "text-zinc-500" : "text-slate-400"}`}>or</span>
            <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  Password
                </label>
                <Link href="/forgot-password" className={`text-xs hover:underline ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-zinc-400" : "text-slate-400"}`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className={`mt-5 text-center text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--color-accent)] hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
