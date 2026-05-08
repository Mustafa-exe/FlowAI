"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
  }),
};

export default function MultiStepForm({
  totalSteps,
  onComplete,
}: {
  totalSteps: number;
  onComplete: (answers: Record<string, string>) => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({
    title: "",
    dueDate: "",
    priority: "Medium",
  });

  const canNext = useMemo(() => {
    if (currentStep === 1) return Boolean(answers.title.trim());
    if (currentStep === 2) return Boolean(answers.dueDate.trim());
    return true;
  }, [answers, currentStep]);

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    if (!canNext) return;
    if (currentStep === totalSteps) {
      onComplete(answers);
      return;
    }
    setDirection(1);
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  };

  return (
    <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-4 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <motion.div
          className="h-1 rounded-full bg-[var(--color-accent)]"
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {currentStep === 1 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">Step 1 of {totalSteps}</p>
              <p className="mt-2 text-sm font-semibold">What should we call the task?</p>
              <input
                value={answers.title}
                onChange={(e) => setAnswers((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                placeholder="e.g. Focus block"
              />
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">Step 2 of {totalSteps}</p>
              <p className="mt-2 text-sm font-semibold">When is it due?</p>
              <input
                value={answers.dueDate}
                onChange={(e) => setAnswers((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                placeholder="e.g. Tomorrow, 3 PM"
              />
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">Step 3 of {totalSteps}</p>
              <p className="mt-2 text-sm font-semibold">Priority</p>
              <div className="mt-3 flex gap-2">
                {["High", "Medium", "Low"].map((value) => {
                  const active = answers.priority === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, priority: value }))}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        active ? "bg-[var(--color-accent)] text-white" : "border border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-400"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`rounded-full px-3 py-1.5 text-xs ${
            currentStep === 1 ? "cursor-not-allowed text-slate-400 dark:text-zinc-600" : "text-slate-600 dark:text-zinc-300"
          }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          className={`rounded-full px-4 py-1.5 text-xs font-medium ${
            canNext ? "bg-[var(--color-accent)] text-white" : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-zinc-600"
          }`}
        >
          {currentStep === totalSteps ? "Create" : "Next"}
        </button>
      </div>
    </div>
  );
}

