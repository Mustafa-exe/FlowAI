"use client";

import { motion } from "framer-motion";

export function WeekViewSkeleton() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-16 shrink-0 border-r border-slate-200 p-2 dark:border-white/10">
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-3 rounded bg-slate-200 dark:bg-white/10"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
      <div className="grid flex-1 grid-cols-7 gap-0">
        {Array.from({ length: 7 }).map((_, col) => (
          <div key={col} className="relative border-r border-slate-200 p-2 dark:border-white/10">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-lg bg-slate-200 dark:bg-white/10"
                style={{
                  height: `${[60, 120, 60][i]}px`,
                  marginTop: `${[40, 10, 30][i]}px`,
                }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: col * 0.1 + i * 0.2 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthViewSkeleton() {
  return (
    <div className="grid flex-1 grid-cols-7">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="min-h-[100px] border-b border-r border-slate-200 p-2 dark:border-white/10">
          <motion.div
            className="mb-2 h-6 w-6 rounded-full bg-slate-200 dark:bg-white/10"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.02 }}
          />
          <motion.div
            className="mb-1 h-4 rounded bg-slate-200 dark:bg-white/10"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.02 + 0.1 }}
          />
          {i % 3 === 0 ? (
            <motion.div
              className="h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.02 + 0.2 }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

