"use client";

import { motion } from "framer-motion";

export function getStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}

const strengthConfig = {
  0: { label: "", color: "bg-transparent" },
  1: { label: "Weak", color: "bg-red-500" },
  2: { label: "Fair", color: "bg-amber-500" },
  3: { label: "Good", color: "bg-amber-400" },
  4: { label: "Strong", color: "bg-green-500" },
} as const;

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getStrength(password);
  const cfg = strengthConfig[strength];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => {
          const active = i < strength;
          return (
            <motion.div
              key={i}
              className={`h-1.5 rounded-full ${active ? cfg.color : "bg-slate-200 dark:bg-white/10"}`}
              transition={{ duration: 0.2 }}
              animate={{ opacity: active ? 1 : 0.5 }}
            />
          );
        })}
      </div>
      <p className={`text-xs ${strength === 4 ? "text-green-500" : strength > 0 ? "text-amber-500" : "text-slate-500 dark:text-zinc-500"}`}>
        {cfg.label ? `${cfg.label} password` : ""}
      </p>
    </div>
  );
}

