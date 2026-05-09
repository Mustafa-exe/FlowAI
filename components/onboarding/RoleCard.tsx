"use client";

import { Check } from "lucide-react";

export default function RoleCard({
  id,
  label,
  description,
  icon,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <label className="role-card relative block cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-150 dark:border-white/10 dark:bg-[#111114]">
      <input
        type="radio"
        name="role"
        value={id}
        className="sr-only"
        checked={checked}
        onChange={() => onChange(id)}
      />
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-zinc-300">
        {icon}
      </div>
      <p className="text-xl font-semibold tracking-[-0.02em]">{label}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">{description}</p>
      <span className="checkmark-badge absolute right-3 top-3 scale-90 rounded-full bg-[var(--color-accent)] p-1 text-white opacity-0 transition-all">
        <Check className="size-3.5" />
      </span>
    </label>
  );
}

