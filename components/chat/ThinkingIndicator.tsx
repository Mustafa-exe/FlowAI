"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function ThinkingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
        <Sparkles size={14} className="text-[var(--color-accent)]" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#16161a]">
        <div className="flex h-4 items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

