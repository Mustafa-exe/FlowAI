"use client";

import { motion } from "framer-motion";

export default function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-[var(--color-accent)]" : "bg-slate-200 dark:bg-white/10"
      }`}
    >
      <div className={`absolute left-0 top-0 h-6 w-11 rounded-full`} />
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="toggle-thumb absolute left-0 top-0.5 size-5 rounded-full bg-white shadow"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

