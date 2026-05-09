"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eraser } from "lucide-react";
import ChatThread from "@/components/chat/ChatThread";
import ChatInputBar from "@/components/chat/ChatInputBar";
import SuggestionPills from "@/components/chat/SuggestionPills";
import { Message, MultiStepState } from "@/types/chat";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { subscribeToChatMessages, addChatMessage, clearChatMessages } from "@/lib/firestoreCollections";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function ChatPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const { user, isAuthReady } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [multiStep, setMultiStep] = useState<MultiStepState>({
    active: false,
    currentStep: 1,
    totalSteps: 3,
    answers: {},
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to Firestore chat messages
  useEffect(() => {
    if (!isAuthReady || !user) return;
    const unsub = subscribeToChatMessages(user.uid, (msgs) => {
      // Seed a welcome message for new users
      if (msgs.length === 0) {
        addChatMessage(user.uid, {
          role: "system",
          type: "system",
          content: "Connected to FlowAI Assistant",
          timestamp: new Date().toISOString(),
        });
        return;
      }
      setMessages(msgs);
    });
    return () => unsub();
  }, [isAuthReady, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, multiStep.active]);

  const timeNow = () => new Date().toISOString();

  const handleClearChat = async () => {
    if (!user) return;
    await clearChatMessages(user.uid);
    await addChatMessage(user.uid, {
      role: "system",
      type: "system",
      content: "Chat cleared",
      timestamp: timeNow(),
    });
    setMultiStep((prev) => ({ ...prev, active: false }));
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const text = input.trim();
    const userMsg: Omit<Message, "id"> = {
      role: "user",
      type: "text",
      content: text,
      timestamp: timeNow(),
    };

    await addChatMessage(user.uid, userMsg);
    setInput("");
    setIsThinking(true);

    const lowered = text.toLowerCase().trim();
    const isAmbiguous = lowered === "add a task" || lowered === "add task";

    await new Promise((r) => setTimeout(r, 1200));
    setIsThinking(false);

    if (isAmbiguous) {
      setMultiStep({ active: true, currentStep: 1, totalSteps: 3, answers: {} });
      return;
    }

    const isTaskCommand = lowered.includes("add task:") || lowered.includes("create task:");
    const aiMsg: Omit<Message, "id"> = isTaskCommand
      ? {
          role: "ai",
          type: "task-card",
          content: "Done! I've created that task for you.",
          taskCard: {
            title: text.replace(/add task:|create task:/i, "").split("by")[0].trim() || "New task",
            description: "Created via AI assistant",
            dueDate: "As specified",
            priority: "Medium",
            status: "Pending",
          },
          timestamp: timeNow(),
        }
      : {
          role: "ai",
          type: "text",
          content: "I've processed your request. Is there anything else you'd like to automate?",
          timestamp: timeNow(),
        };

    await addChatMessage(user.uid, aiMsg);
  };

  const handleMultiStepComplete = async (answers: Record<string, string>) => {
    if (!user) return;
    setMultiStep((prev) => ({ ...prev, active: false }));
    await addChatMessage(user.uid, {
      role: "ai",
      type: "task-card",
      content: "Perfect — here's what I created:",
      taskCard: {
        title: answers.title,
        description: "Created via guided assistant",
        dueDate: answers.dueDate,
        priority: (answers.priority as "High" | "Medium" | "Low") ?? "Medium",
        status: "Pending",
      },
      timestamp: timeNow(),
    });
  };

  const pageShell = useMemo(
    () => (isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"),
    [isDark],
  );

  return (
    <div className={pageShell}>
      <DashboardSidebar />

      <div className="md:pl-[72px] lg:pl-60">
        <div className={`sticky top-0 z-20 border-b ${isDark ? "border-white/10 bg-[#111114]/85" : "border-slate-200 bg-white/85"} backdrop-blur`}>
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>AI Assistant</p>
              <h1 className="mt-1 text-lg font-semibold tracking-[-0.03em]">How can I help you today?</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearChat}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                  isDark ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Eraser className="size-4" />
                Clear chat
              </button>
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-4xl px-4 pb-2 sm:px-6">
            <SuggestionPills onSelect={(value) => setInput(value)} />
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-64px)] flex-col">
          <ChatThread
            messages={messages}
            isThinking={isThinking}
            multiStep={multiStep}
            onMultiStepComplete={handleMultiStepComplete}
            bottomRef={bottomRef}
          />
          <ChatInputBar input={input} setInput={setInput} onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
