"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PasswordStrengthMeter, { getStrength } from "./PasswordStrengthMeter";
import { useAuth } from "@/components/auth-provider";

type Props = {
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
  errors: Record<string, string>;
  // Full form data needed to save to Firestore on account creation
  formData: {
    name: string;
    username: string;
    role: string;
    goals: string[];
    goalNotes: string;
  };
  dispatchForm: React.Dispatch<{ type: string; [key: string]: any }>;
  dispatchError: React.Dispatch<{ field: string; error: string }>;
  onBack: () => void;
  onNext: () => void;
};

export default function StepPassword({
  password,
  confirmPassword,
  agreedToTerms,
  errors,
  formData,
  dispatchForm,
  dispatchError,
  onBack,
  onNext,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const strength = getStrength(password);

  const validatePassword = () => {
    if (strength < 3) {
      dispatchError({ field: "password", error: "Password must be at least Good strength." });
      return false;
    }
    dispatchError({ field: "password", error: "" });
    return true;
  };

  const validateConfirm = () => {
    if (confirmPassword !== password) {
      dispatchError({ field: "confirmPassword", error: "Passwords don't match." });
      return false;
    }
    dispatchError({ field: "confirmPassword", error: "" });
    return true;
  };

  const validateTerms = () => {
    if (!agreedToTerms) {
      dispatchError({ field: "terms", error: "You must agree to continue." });
      return false;
    }
    dispatchError({ field: "terms", error: "" });
    return true;
  };

  // Require a real email — the email field is in StepWelcome's parent form
  // We get it from formData via the parent OnboardingFlow
  const canContinue = strength >= 3 && confirmPassword === password && agreedToTerms;

  const saveOnboardingData = async (uid: string) => {
    // Save profile
    await setDoc(doc(db, "users", uid, "profile", "info"), {
      displayName: formData.name.trim() || formData.username.trim() || "User",
      username: formData.username.toLowerCase().trim(),
      role: formData.role || "Team Member",
      goals: formData.goals,
      goalNotes: formData.goalNotes,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    // Reserve username
    if (formData.username.trim()) {
      await setDoc(doc(db, "usernames", formData.username.toLowerCase().trim()), {
        uid,
        username: formData.username.toLowerCase().trim(),
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleEmailSignup = async () => {
    setSubmitError("");
    const valid = validatePassword() && validateConfirm() && validateTerms();
    if (!valid) return;

    // We need an email — it's stored in the parent form as formData.email
    // But the current OnboardingFlow doesn't collect email in StepWelcome.
    // We'll prompt for it here if missing.
    const email = (formData as any).email;
    if (!email || !email.includes("@")) {
      setSubmitError("Please go back and enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const user = await signUpWithEmail(
        email,
        password,
        formData.name.trim() || formData.username.trim()
      );
      await saveOnboardingData(user.uid);
      onNext();
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setSubmitError("An account with this email already exists. Try signing in.");
      } else if (code === "auth/weak-password") {
        setSubmitError("Password is too weak.");
      } else if (code === "auth/invalid-email") {
        setSubmitError("Invalid email address.");
      } else {
        setSubmitError("Account creation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setSubmitError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // For Google users, save whatever onboarding data was collected
      // The user object is updated in auth-provider; we save after sign-in
      onNext();
    } catch {
      setSubmitError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-[#111114]">
      <h2 className="text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.05em]">Secure your account</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Choose a strong password to protect your data.</p>

      <div className="mt-6 space-y-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">New password</p>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => dispatchForm({ type: "SET_FIELD", field: "password", value: e.target.value })}
              onBlur={validatePassword}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-2 rounded p-1 text-slate-500 dark:text-zinc-400">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="mt-2"><PasswordStrengthMeter password={password} /></div>
          <AnimatePresence>
            {errors.password && (
              <motion.p key="pw-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1 text-sm text-red-500">
                {errors.password}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Confirm password</p>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => dispatchForm({ type: "SET_FIELD", field: "confirmPassword", value: e.target.value })}
              onBlur={validateConfirm}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5"
            />
            <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-2 top-2 rounded p-1 text-slate-500 dark:text-zinc-400">
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <AnimatePresence>
            {confirmPassword && !errors.confirmPassword && (
              <motion.p key="pw-ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1 text-sm text-emerald-500">
                ✓ Passwords match
              </motion.p>
            )}
            {errors.confirmPassword && (
              <motion.p key="cpw-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1 text-sm text-red-500">
                {errors.confirmPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <label className="inline-flex cursor-pointer items-start gap-2 text-sm text-slate-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => {
              dispatchForm({ type: "SET_FIELD", field: "agreedToTerms", value: e.target.checked });
              dispatchError({ field: "terms", error: "" });
            }}
            onBlur={validateTerms}
            className="mt-0.5 size-4 rounded border-slate-300 accent-[var(--color-accent)]"
          />
          I agree to the Terms of Service and Security Protocols.
        </label>
        <AnimatePresence>
          {errors.terms && (
            <motion.p key="terms-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1 text-sm text-red-500">
              {errors.terms}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submitError && (
            <motion.p key="submit-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {submitError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="button" onClick={onBack}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium dark:border-white/10 dark:bg-transparent">
          Back
        </motion.button>
        <motion.button
          whileHover={canContinue ? { scale: 1.01 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          type="button"
          disabled={!canContinue || loading}
          onClick={handleEmailSignup}
          className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white ${
            canContinue && !loading ? "bg-[var(--color-accent)]" : "cursor-not-allowed bg-slate-300 dark:bg-white/10"
          }`}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Creating account…" : "Continue →"}
        </motion.button>
      </div>

      {/* Divider */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-xs text-slate-400 dark:text-zinc-500">or sign up with</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>

      {/* Google */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        disabled={googleLoading}
        onClick={handleGoogleSignup}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
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
      </motion.button>
    </div>
  );
}
