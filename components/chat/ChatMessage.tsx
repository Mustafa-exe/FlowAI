"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Message } from "@/types/chat";
import SystemMessage from "./SystemMessage";
import TaskCardMessage from "./TaskCardMessage";

const messageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function ChatMessage({ message }: { message: Message }) {
  if (message.type === "system") {
    return <SystemMessage content={message.content ?? ""} />;
  }

  if (message.role === "user") {
    return (
      <motion.div variants={messageVariants} className="flex items-end justify-end gap-2">
        <div className="max-w-[70%]">
          <div className="rounded-2xl rounded-br-sm bg-[var(--color-accent)] px-4 py-3 text-sm text-white whitespace-pre-wrap">
            {message.content}
          </div>
          <p className="mt-1 text-right text-xs text-slate-500 dark:text-zinc-500">{message.timestamp}</p>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-xs font-bold text-[var(--color-accent)]">
          MK
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={messageVariants} className="flex items-end gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
        <Sparkles size={14} className="text-[var(--color-accent)]" />
      </div>
      <div className="max-w-[70%]">
        <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#16161a] whitespace-pre-wrap">
          {message.content}
          {message.type === "task-card" && message.taskCard ? <TaskCardMessage taskCard={message.taskCard} /> : null}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">{message.timestamp}</p>
      </div>
    </motion.div>
  );
}

