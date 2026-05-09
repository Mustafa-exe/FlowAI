"use client";

import { motion } from "framer-motion";
import { ArrowUp, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Detect speech support after mount only (avoids SSR hydration mismatch)
  useEffect(() => {
    const w = window as any;
    setSpeechSupported(
      typeof window !== "undefined" &&
      !!(w.SpeechRecognition || w.webkitSpeechRecognition)
    );
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 120) + "px";
  }, [input]);

  const startListening = () => {
    if (!speechSupported) return;

    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(input + transcript);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

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

        {/* Mic button — only rendered if browser supports Speech API */}
        {speechSupported && (
          <motion.button
            type="button"
            onClick={toggleListening}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={
              isListening
                ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
                : {}
            }
            className={`flex size-9 items-center justify-center rounded-full transition-colors ${
              isListening
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40"
                : "bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/20"
            }`}
            aria-label={isListening ? "Stop recording" : "Start voice input"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </motion.button>
        )}

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
