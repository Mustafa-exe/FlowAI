"use client";

import { motion } from "framer-motion";

export default function SkeletonRow({ lines = 2 }: { lines?: 1 | 2 }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
      <div className="min-w-0 flex-1">
        <motion.div
          className="h-4 w-48 rounded bg-slate-200 dark:bg-white/10"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        {lines === 2 ? (
          <motion.div
            className="mt-2 h-3 w-64 rounded bg-slate-200 dark:bg-white/10"
            animate={{ opacity: [0.35, 0.75, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.15 }}
          />
        ) : null}
      </div>
      <motion.div
        className="h-6 w-12 rounded-full bg-slate-200 dark:bg-white/10"
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: 0.25 }}
      />
    </div>
  );
}

