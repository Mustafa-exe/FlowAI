"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CheckmarkAnimation from "./CheckmarkAnimation";

const featurePills = [
  "AI Task Parsing is active",
  "Smart Prioritization enabled",
  "Daily Summary scheduled for 7:00 AM",
];

export default function StepSuccess({ name }: { name: string }) {
  const router = useRouter();
  const [showHeadline, setShowHeadline] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showPills, setShowPills] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowHeadline(true), 900);
    const t2 = window.setTimeout(() => setShowSubtitle(true), 1100);
    const t3 = window.setTimeout(() => setShowPills(true), 1300);
    const t4 = window.setTimeout(() => setShowCta(true), 1700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-white/10 dark:bg-[#111114]">
      <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-emerald-500/10 p-4">
        <CheckmarkAnimation />
      </div>

      {showHeadline ? (
        <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.05em]">
          You&apos;re all set, {name || "there"}!
        </motion.h2>
      ) : null}

      {showSubtitle ? (
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-zinc-400">
          Your personalized AI productivity workspace is ready. We&apos;ve configured everything based on your preferences.
        </motion.p>
      ) : null}

      {showPills ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {featurePills.map((pill) => (
            <motion.span
              key={pill}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
            >
              ✓ {pill}
            </motion.span>
          ))}
        </motion.div>
      ) : null}

      {showCta ? (
        <motion.button
          type="button"
          onClick={() => router.push("/dashboard")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-8 rounded-xl bg-[var(--color-accent)] px-7 py-3 text-sm font-semibold text-white"
        >
          Go to Dashboard →
        </motion.button>
      ) : null}
    </div>
  );
}

