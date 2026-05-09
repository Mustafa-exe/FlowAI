"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Sora } from "next/font/google";
import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "./ProgressBar";
import StepWelcome from "./StepWelcome";
import StepRole from "./StepRole";
import StepGoals from "./StepGoals";
import StepPassword from "./StepPassword";
import StepSuccess from "./StepSuccess";
import { useAuth } from "@/components/auth-provider";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

type FormState = {
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
  otherRole: string;
  goals: string[];
  goalNotes: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
};

type FormAction = { type: "SET_FIELD"; field: keyof FormState; value: string | string[] | boolean | null };

// Looser dispatch type accepted by step components
export type StepDispatch = React.Dispatch<{ type: string; field?: string; value?: any; [key: string]: any }>;

function formReducer(state: FormState, action: FormAction): FormState {
  if (action.type === "SET_FIELD") {
    return { ...state, [action.field]: action.value } as FormState;
  }
  return state;
}

type ErrorAction = { field: string; error: string };
function errorReducer(state: Record<string, string>, action: ErrorAction) {
  return { ...state, [action.field]: action.error };
}

export default function OnboardingFlow() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, dispatchForm] = useReducer(formReducer, {
    name: "",
    username: "",
    email: "",
    avatar: null,
    role: "",
    otherRole: "",
    goals: [],
    goalNotes: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [errors, dispatchError] = useReducer(errorReducer, {});

  // If user is already authenticated, skip onboarding and go to dashboard
  useEffect(() => {
    if (isAuthReady && user && currentStep < 5) {
      router.replace("/dashboard");
    }
  }, [isAuthReady, user, currentStep, router]);

  const totalSteps = 5;

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <StepWelcome
          formData={{ name: formData.name, username: formData.username, avatar: formData.avatar }}
          errors={errors}
          dispatchForm={dispatchForm as any}
          dispatchError={dispatchError}
          onNext={() => setCurrentStep(2)}
        />
      );
    }
    if (currentStep === 2) {
      return (
        <StepRole
          role={formData.role}
          otherRole={formData.otherRole}
          error={errors.role}
          dispatchForm={dispatchForm as any}
          dispatchError={dispatchError}
          onBack={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      );
    }
    if (currentStep === 3) {
      return (
        <StepGoals
          selectedGoals={formData.goals}
          notes={formData.goalNotes}
          error={errors.goals}
          dispatchForm={dispatchForm as any}
          dispatchError={dispatchError}
          onBack={() => setCurrentStep(2)}
          onNext={() => setCurrentStep(4)}
        />
      );
    }
    if (currentStep === 4) {
      return (
        <>
          {/* Email field — required before password step */}
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#111114]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Email address</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Required to create your account</p>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                dispatchForm({ type: "SET_FIELD", field: "email", value: e.target.value });
                dispatchError({ field: "email", error: "" });
              }}
              placeholder="you@gmail.com"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5"
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  key="email-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-1 text-sm text-red-500"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <StepPassword
            password={formData.password}
            confirmPassword={formData.confirmPassword}
            agreedToTerms={formData.agreedToTerms}
            errors={errors}
            formData={{
              name: formData.name,
              username: formData.username,
              email: formData.email,
              role: formData.role,
              goals: formData.goals,
              goalNotes: formData.goalNotes,
            } as any}
            dispatchForm={dispatchForm as any}
            dispatchError={dispatchError}
            onBack={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
          />
        </>
      );
    }
    return <StepSuccess name={formData.name || user?.displayName || "there"} />;
  };

  return (
    <div className={`${sora.className} flex min-h-screen flex-col`}>
      <header className="px-8 pb-4 pt-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <p className="text-4xl font-semibold tracking-[-0.06em]">FlowAI</p>
          <div className="flex items-center gap-4">
            <p className="text-xs uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">
              {currentStep < 5 ? "Onboarding" : "Workspace Ready"}
            </p>
            {currentStep < 5 && (
              <Link
                href="/login"
                className="text-xs font-medium text-slate-500 underline-offset-4 hover:underline dark:text-zinc-400"
              >
                Already have an account? Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          {currentStep < 5 ? <ProgressBar currentStep={currentStep} totalSteps={totalSteps} /> : null}
          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="px-8 pb-8 pt-2">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between text-xs text-slate-500 dark:text-zinc-500">
          <p>© 2025 FlowAI Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/settings#security" className="hover:text-slate-700 dark:hover:text-zinc-300">Privacy Policy</Link>
            <Link href="/settings#security" className="hover:text-slate-700 dark:hover:text-zinc-300">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
