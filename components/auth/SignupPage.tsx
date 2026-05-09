"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { useThemeMode } from "@/components/theme-provider";

type UsernameStatus = "idle" | "checking" | "available" | "taken";

async function isUsernameTaken(username: string): Promise<boolean> {
  const q = query(collection(db, "usernames"), where("username", "==", username.toLowerCase()));
  const snap = await getDocs(q);
  return !snap.empty;
}

export default function SignupPage() {
  const router = useRouter();
  const { user, isAuthReady, signInWithGoogle } = useAuth();
  const { theme } = useThemeMode();
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const usernameTimer = useRef<number | null>(null);

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthReady && user) {
      router.replace("/dashboard");
    }
  }, [isAuthReady, user, router]);

  // Debounced username uniqueness check against Firestore
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameTimer.current) window.clearTimeout(usernameTimer.current);
    if (!value.trim()) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    usernameTimer.current = window.setTimeout(async () => {
      try {
        const taken = await isUsernameTaken(value.trim());
        setUsernameStatus(taken ? "taken" : "available");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.toLowerCase().includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("That username is already taken. Please choose another.");
      return;
    }
    if (usernameStatus === "checking") {
      setError("Still checking username availability. Please wait.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Set display name
      await updateProfile(cred.user, { displayName: name.trim() || username.trim() });
      // Reserve username in Firestore
      if (username.trim()) {
        await setDoc(doc(db, "usernames", username.toLowerCase()), {
          uid: cred.user.uid,
          username: username.toLowerCase(),
          createdAt: new Date().toISOString(),
        });
      }
      // Save profile
      await setDoc(doc(db, "users", cred.user.uid, "profile", "info"), {
        displayName: name.trim() || username.trim(),
        username: username.toLowerCase(),
        role: "Team Member",
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      });
      router.replace("/dashboard");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
    <div className={`flex min-h-screen items-center justify-center px-4 py-10 ${isDark ? "bg-[#0d0d0f]" : "bg-[#f8fafc]"}`}>
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
            Create your account
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
            Start automating your workflow today
          </p>
        </div>

        <div className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#16161a]" : "border-slate-200 bg-white shadow-sm"}`}>
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignup}
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
            {googleLoading ? "Signing up…" : "Continue with Google"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
            <span className={`text-xs ${isDark ? "text-zinc-500" : "text-slate-400"}`}>or sign up with email</span>
            <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            {/* Full name */}
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Muhammad Mustafa"
                className={inputClass}
              />
            </div>

            {/* Username */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  Username
                </label>
                <span className="text-xs">
                  {usernameStatus === "checking" && (
                    <span className={`inline-flex items-center gap-1 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      <Loader2 className="size-3 animate-spin" /> checking
                    </span>
                  )}
                  {usernameStatus === "available" && (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <Check className="size-3" /> Available
                    </span>
                  )}
                  {usernameStatus === "taken" && (
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <X className="size-3" /> Taken
                    </span>
                  )}
                </span>
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="@mustafa"
                className={`${inputClass} ${usernameStatus === "taken" ? "border-red-500/50" : usernameStatus === "available" ? "border-emerald-500/50" : ""}`}
              />
            </div>

            {/* Email */}
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
                placeholder="you@gmail.com"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
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
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= level * 3
                          ? level <= 1 ? "bg-red-500" : level <= 2 ? "bg-amber-500" : level <= 3 ? "bg-yellow-500" : "bg-emerald-500"
                          : isDark ? "bg-white/10" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Terms */}
            <label className={`flex cursor-pointer items-start gap-2.5 text-sm ${isDark ? "text-zinc-300" : "text-slate-600"}`}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 accent-[var(--color-accent)]"
              />
              I agree to the{" "}
              <Link href="/settings#security" className="text-[var(--color-accent)] hover:underline">
                Terms of Service
              </Link>
            </label>

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
              disabled={loading || usernameStatus === "taken" || usernameStatus === "checking"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className={`mt-5 text-center text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
