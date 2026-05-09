"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eraser, Sparkles } from "lucide-react";
import ChatThread from "@/components/chat/ChatThread";
import ChatInputBar from "@/components/chat/ChatInputBar";
import SuggestionPills from "@/components/chat/SuggestionPills";
import { Message, MultiStepState } from "@/types/chat";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { subscribeToChatMessages, addChatMessage, clearChatMessages, addTask, subscribeToTasks } from "@/lib/firestoreCollections";
import type { Task } from "@/types/task";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { createCalendarEvent, loadGCalToken, isTokenValid } from "@/lib/googleCalendar";

export default function ChatPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const { user, isAuthReady } = useAuth();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState(() => searchParams.get("prompt") ?? "");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
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
      if (msgs.length === 0) {
        addChatMessage(user.uid, {
          role: "system",
          type: "system",
          content: "Connected to FlowAI Assistant — powered by Gemini AI",
          timestamp: new Date().toISOString(),
        });
        return;
      }
      setMessages(msgs);
    });
    return () => unsub();
  }, [isAuthReady, user]);

  // Subscribe to tasks so Gemini has context
  useEffect(() => {
    if (!isAuthReady || !user) return;
    const unsub = subscribeToTasks(user.uid, setTasks);
    return () => unsub();
  }, [isAuthReady, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const timeNow = () => new Date().toISOString();

  const handleClearChat = async () => {
    if (!user) return;
    setError("");
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
    setInput("");
    setError("");
    setIsThinking(true);

    // Optimistically add user message to UI
    const optimisticUserMsg: Message = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      type: "text",
      content: text,
      timestamp: timeNow(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      // Get Firebase ID token for the Authorization header
      const idToken = await user.getIdToken();

      // Save user message to Firestore
      await addChatMessage(user.uid, {
        role: "user",
        type: "text",
        content: text,
        timestamp: timeNow(),
      });

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: text,
          // Pass user's real tasks so Gemini can answer questions about them
          tasks: tasks.map((t) => ({
            title:       t.title,
            description: t.description,
            dueDate:     t.dueDate,
            priority:    t.priority,
            status:      t.status,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "AI request failed");
      }

      // If tasks were created by Gemini, save them to Firestore AND Google Calendar
      if (data.tasks_created?.length > 0) {
        // Check if Google Calendar is connected — refresh token check
        const gcalToken = user ? await loadGCalToken(user.uid) : null;
        const gcalAccessToken = gcalToken && isTokenValid(gcalToken) ? gcalToken.accessToken : null;
        const gcalConnected = !!gcalAccessToken;
        let gcalSynced = 0;
        let gcalError = "";

        await Promise.all(
          data.tasks_created.map(async (task: any) => {
            const priority = (task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) as "High" | "Medium" | "Low";
            const status = task.status === "todo" ? "Pending" : task.status === "in-progress" ? "In Progress" : "Completed";

            // Default due_date to today at 09:00 if Gemini didn't provide one
            const dueDate = task.due_date || new Date().toISOString().slice(0, 10) + "T09:00";

            // Save to Firestore tasks
            await addTask(user.uid, {
              title:       task.title,
              description: task.description,
              dueDate,
              priority,
              status,
              assignee:    user.displayName || user.email?.split("@")[0] || "Me",
              tags:        [],
            });

            // Push to Google Calendar if connected
            if (gcalConnected) {
              try {
                await createCalendarEvent(gcalAccessToken!, {
                  title:       task.title,
                  description: task.description || "",
                  dueDate,
                  priority,
                });
                gcalSynced++;
              } catch (calErr: any) {
                const msg = calErr?.message ?? "";
                if (msg.includes("401") || msg.includes("expired")) {
                  gcalError = "Google Calendar token expired — reconnect in Settings → Integrations.";
                } else if (msg.includes("403") || msg.includes("disabled")) {
                  gcalError = "Google Calendar API not enabled. Enable it in Google Cloud Console.";
                } else {
                  gcalError = `Google Calendar sync failed: ${msg}`;
                }
                console.warn("[chat] Google Calendar sync failed:", calErr);
              }
            }
          })
        );

        const firstTask = data.tasks_created[0];
        const calendarNote = gcalConnected
          ? gcalSynced > 0
            ? ` ✓ Also added to Google Calendar.`
            : gcalError
              ? ` ⚠️ ${gcalError}`
              : ""
          : "";

        const taskMsg: Omit<Message, "id"> = {
          role: "ai",
          type: "task-card",
          content: (data.reply || `Created ${data.tasks_created.length} task${data.tasks_created.length > 1 ? "s" : ""} for you.`) + calendarNote,
          taskCard: {
            title:       firstTask.title,
            description: firstTask.description,
            dueDate:     firstTask.due_date || new Date().toISOString().slice(0, 10) + "T09:00",
            priority:    (firstTask.priority.charAt(0).toUpperCase() + firstTask.priority.slice(1)) as "High" | "Medium" | "Low",
            status:      firstTask.status === "todo" ? "Pending" : firstTask.status === "in-progress" ? "In Progress" : "Completed",
          },
          timestamp: timeNow(),
        };
        await addChatMessage(user.uid, taskMsg);
      } else {
        // Plain text reply — save to Firestore
        const aiMsg: Omit<Message, "id"> = {
          role:      "ai",
          type:      "text",
          content:   data.reply || "I've processed your request.",
          timestamp: timeNow(),
        };
        await addChatMessage(user.uid, aiMsg);
      }

      // Remove optimistic message — Firestore subscription will update the list
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));

    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong. Please try again.";
      setError(msg);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
    } finally {
      setIsThinking(false);
    }
  };

  const handleMultiStepComplete = async (answers: Record<string, string>) => {
    if (!user) return;
    setMultiStep((prev) => ({ ...prev, active: false }));
    // Send the completed form as a natural language message to Gemini
    const taskDescription = `Create a task: "${answers.title}" due ${answers.dueDate}, priority ${answers.priority}`;
    setInput(taskDescription);
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
              <div className="flex items-center gap-2">
                <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>AI Assistant</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                  <Sparkles className="size-2.5" />
                  Gemini
                </span>
              </div>
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
          {/* Error banner */}
          {error && (
            <div className={`mx-auto mt-3 w-full max-w-4xl px-4 sm:px-6`}>
              <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-3 text-xs text-red-400 hover:text-red-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

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

