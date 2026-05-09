"use client";

import { AnimatePresence, motion } from "framer-motion";
import GoalChip from "./GoalChip";

const goals = [
  "Reduce context switching",
  "Meet deadlines consistently",
  "Automate repetitive tasks",
  "Improve focus time",
  "Better team coordination",
  "Track time accurately",
  "Prioritize smarter",
  "Build better habits",
];

export default function StepGoals({
  selectedGoals,
  notes,
  error,
  dispatchForm,
  dispatchError,
  onBack,
  onNext,
}: {
  selectedGoals: string[];
  notes: string;
  error?: string;
  dispatchForm: React.Dispatch<{ type: string; [key: string]: any }>;
  dispatchError: React.Dispatch<{ field: string; error: string }>;
  onBack: () => void;
  onNext: () => void;
}) {
  const validate = () => {
    if (selectedGoals.length < 1) {
      dispatchError({ field: "goals", error: "Pick at least one goal to continue." });
      return false;
    }
    dispatchError({ field: "goals", error: "" });
    return true;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-[#111114]">
      <h2 className="text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.05em]">What do you want to achieve?</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Select the goals that matter most to your workflow.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {goals.map((goal) => (
          <GoalChip
            key={goal}
            label={goal}
            checked={selectedGoals.includes(goal)}
            onChange={(checked) => {
              dispatchForm({
                type: "SET_FIELD",
                field: "goals",
                value: checked ? [...selectedGoals, goal] : selectedGoals.filter((g) => g !== goal),
              });
              dispatchError({ field: "goals", error: "" });
            }}
          />
        ))}
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Anything else? (optional)</p>
        <textarea
          value={notes}
          onChange={(e) => dispatchForm({ type: "SET_FIELD", field: "goalNotes", value: e.target.value })}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5"
          placeholder="Tell us about your specific productivity challenges..."
          rows={4}
        />
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-2 text-sm text-red-500">
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="button" onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium dark:border-white/10 dark:bg-transparent">
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => {
            if (validate()) onNext();
          }}
          className="rounded-xl bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          Continue →
        </motion.button>
      </div>
    </div>
  );
}

