"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Message, MultiStepState } from "@/types/chat";
import ChatMessage from "./ChatMessage";
import ThinkingIndicator from "./ThinkingIndicator";
import MultiStepForm from "./MultiStepForm";

export default function ChatThread({
  messages,
  isThinking,
  multiStep,
  onMultiStepComplete,
  bottomRef,
}: {
  messages: Message[];
  isThinking: boolean;
  multiStep: MultiStepState;
  onMultiStepComplete: (answers: Record<string, string>) => void;
  bottomRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {isThinking ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <ThinkingIndicator />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {multiStep.active ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="flex items-end gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                  {/* spacer avatar to align with AI bubble */}
                  <span className="text-xs font-semibold text-[var(--color-accent)]">AI</span>
                </div>
                <div className="max-w-[70%]">
                  <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#16161a]">
                    <p className="text-sm font-semibold">Understood. I’m setting up a task — a few quick questions.</p>
                    <MultiStepForm totalSteps={multiStep.totalSteps} onComplete={onMultiStepComplete} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

