"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Code2, LayoutPanelTop, PenTool, User, Users } from "lucide-react";
import RoleCard from "./RoleCard";

const roles = [
  { id: "solo", icon: <User className="size-5" />, label: "Solo Creator", description: "Independent work" },
  { id: "pm", icon: <LayoutPanelTop className="size-5" />, label: "Product Manager", description: "Roadmaps & sprints" },
  { id: "engineer", icon: <Code2 className="size-5" />, label: "Engineer", description: "Code & shipping" },
  { id: "designer", icon: <PenTool className="size-5" />, label: "Designer", description: "Creative workflows" },
  { id: "lead", icon: <Users className="size-5" />, label: "Team Lead", description: "Managing people" },
  { id: "consultant", icon: <Briefcase className="size-5" />, label: "Consultant", description: "Client projects" },
] as const;

export default function StepRole({
  role,
  otherRole,
  error,
  dispatchForm,
  dispatchError,
  onBack,
  onNext,
}: {
  role: string;
  otherRole: string;
  error?: string;
  dispatchForm: React.Dispatch<{ type: string; [key: string]: any }>;
  dispatchError: React.Dispatch<{ field: string; error: string }>;
  onBack: () => void;
  onNext: () => void;
}) {
  const validate = () => {
    if (!role) {
      dispatchError({ field: "role", error: "Please select a role before continuing." });
      return false;
    }
    dispatchError({ field: "role", error: "" });
    return true;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-[#111114]">
      <h2 className="text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.05em]">What best describes you?</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Help us tailor your experience based on your daily workflow.</p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((item) => (
          <RoleCard
            key={item.id}
            id={item.id}
            icon={item.icon}
            label={item.label}
            description={item.description}
            checked={role === item.id}
            onChange={(id) => {
              dispatchForm({ type: "SET_FIELD", field: "role", value: id });
              dispatchError({ field: "role", error: "" });
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {!role ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <textarea
              value={otherRole}
              onChange={(e) => dispatchForm({ type: "SET_FIELD", field: "otherRole", value: e.target.value })}
              placeholder="Other role (optional)"
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

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

