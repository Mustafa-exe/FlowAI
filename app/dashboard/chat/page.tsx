"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eraser, LayoutDashboard, ListTodo, MessageSquareText, Settings2, CalendarDays, ChartColumn, Puzzle } from "lucide-react";
import ChatThread from "@/components/chat/ChatThread";
import ChatInputBar from "@/components/chat/ChatInputBar";
import SuggestionPills from "@/components/chat/SuggestionPills";
import { initialMessages } from "@/data/chatSample";
import { Message, MultiStepState } from "@/types/chat";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquareText },
  { label: "Calendar", href: "/dashboard", icon: CalendarDays },
  { label: "Analytics", href: "/dashboard", icon: ChartColumn },
  { label: "Integrations", href: "/dashboard", icon: Puzzle },
  { label: "Settings", href: "/dashboard", icon: Settings2 },
];

export default function ChatPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [multiStep, setMultiStep] = useState<MultiStepState>({
    active: false,
    currentStep: 1,
    totalSteps: 3,
    answers: {},
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, multiStep.active]);

  const timeNow = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: "system",
        type: "system",
        content: "Chat cleared",
        timestamp: timeNow(),
      },
    ]);
    setMultiStep((prev) => ({ ...prev, active: false }));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const text = input.trim();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      type: "text",
      content: text,
      timestamp: timeNow(),
    };

    setMessages((prev) => [...prev, userMsg]);
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

    const aiMsg: Message = isTaskCommand
      ? {
          id: (Date.now() + 1).toString(),
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
          id: (Date.now() + 1).toString(),
          role: "ai",
          type: "text",
          content: "I've processed your request. Is there anything else you'd like to automate?",
          timestamp: timeNow(),
        };

    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleMultiStepComplete = (answers: Record<string, string>) => {
    setMultiStep((prev) => ({ ...prev, active: false }));

    const taskMsg: Message = {
      id: Date.now().toString(),
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
    };

    setMessages((prev) => [...prev, taskMsg]);
  };

  const pageShell = useMemo(
    () => (isDark ? "min-h-screen bg-[#111114] text-zinc-100" : "min-h-screen bg-[#f8fafc] text-slate-900"),
    [isDark],
  );

  return (
    <div className={pageShell}>
      <aside className={`fixed left-0 top-0 z-30 hidden h-screen w-20 flex-col border-r px-3 py-5 md:flex lg:w-60 lg:px-4 ${isDark ? "border-white/5 bg-[#0d0d0f]" : "border-slate-200 bg-white"}`}>
        <Link href="/" className="flex items-center gap-3 px-1">
          <span className={`grid size-10 place-items-center rounded-2xl text-sm font-semibold ${isDark ? "bg-[#7c6ff7] text-white" : "bg-[#2563eb] text-white"}`}>F</span>
          <span className="hidden text-lg font-semibold tracking-[-0.05em] lg:inline">FlowAI</span>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {sidebarLinks.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard/chat";
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  active
                    ? isDark
                      ? "bg-white/8 text-zinc-100"
                      : "bg-slate-100 text-slate-900"
                    : isDark
                      ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className={`grid size-9 place-items-center rounded-xl ${active ? (isDark ? "bg-[#7c6ff7]/20 text-[#c7bfff]" : "bg-[#2563eb]/10 text-[#2563eb]") : isDark ? "bg-white/5 text-zinc-300" : "bg-slate-100 text-slate-500"}`}>
                  <Icon className="size-4" />
                </span>
                <span className="hidden text-sm font-medium lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-20 lg:pl-60">
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

