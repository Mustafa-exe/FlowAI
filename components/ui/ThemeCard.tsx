"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function ThemeCard({
  id,
  name,
  swatches,
  onDirty,
  checked,
  onSelect,
}: {
  id: string;
  name: string;
  swatches: string[];
  onDirty: () => void;
  checked: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.label
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className="theme-card relative block h-[100px] w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#16161a]"
    >
      <input
        type="radio"
        name="theme"
        value={id}
        className="sr-only"
        checked={checked}
        onChange={() => {
          onSelect(id);
          onDirty();
        }}
      />
      <div className="flex h-10 items-center justify-center gap-1">
        {swatches.map((color) => (
          <div key={color} className="h-5 w-5 rounded-full" style={{ background: color }} />
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-700 dark:text-zinc-200">{name}</p>
      <Check className="checkmark absolute right-3 top-3 size-4 text-[var(--color-accent)] opacity-0 transition-opacity" />
    </motion.label>
  );
}

