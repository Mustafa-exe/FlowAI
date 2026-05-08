"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

export default function SaveBar({
  saveState,
  onCancel,
  onSave,
}: {
  saveState: "idle" | "loading" | "success" | "saved";
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="fixed inset-x-0 bottom-4 z-40 mx-auto flex max-w-3xl items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-white/10 dark:bg-[#16161a]"
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        <span className="size-2 rounded-full bg-amber-400" />
        Unsaved changes
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          <AnimatePresence mode="wait" initial={false}>
            {saveState === "idle" ? (
              <motion.span key="idle" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                Save Changes
              </motion.span>
            ) : null}
            {saveState === "loading" ? (
              <motion.span key="loading" className="inline-flex items-center gap-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <Loader2 className="size-4 animate-spin" /> Saving
              </motion.span>
            ) : null}
            {saveState === "success" ? (
              <motion.span key="success" className="inline-flex items-center gap-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <Check className="size-4" /> Success
              </motion.span>
            ) : null}
            {saveState === "saved" ? (
              <motion.span key="saved" className="inline-flex items-center gap-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <Check className="size-4" /> Saved ✓
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}

