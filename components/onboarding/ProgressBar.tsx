"use client";

import { motion } from "framer-motion";

export default function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;
  return (
    <div>
      <div className="h-1 w-full rounded-full bg-slate-200 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-[var(--color-accent)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}

