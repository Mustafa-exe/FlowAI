"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef } from "react";

export default function ChatInputBar({
  input,
  setInput,
  onSend,
}: {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
  }, [input]);

  const canSend = Boolean(input.trim());

  return (
    <div className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#0d0d0f]">
      <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder='Try: "Add task: finish report by Friday"'
          rows={1}
          className="max-h-[120px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        />
        <motion.button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
          className={`flex size-9 items-center justify-center rounded-full transition-colors ${
            canSend
              ? "bg-[var(--color-accent)] text-white"
              : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-zinc-500"
          }`}
          aria-label="Send message"
        >
          <ArrowUp size={16} />
        </motion.button>
      </div>
    </div>
  );
}

