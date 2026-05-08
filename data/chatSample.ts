import { Message } from "@/types/chat";

export const initialMessages: Message[] = [
  {
    id: "0",
    role: "system",
    type: "system",
    content: "Connected to FlowAI Assistant",
    timestamp: "9:00 AM",
  },
  {
    id: "1",
    role: "user",
    type: "text",
    content: "Add task: finish portfolio redesign by tomorrow 6 PM",
    timestamp: "9:01 AM",
  },
  {
    id: "2",
    role: "ai",
    type: "task-card",
    content: "Got it! I've created that task for you.",
    taskCard: {
      title: "Portfolio Redesign",
      description: "Finish portfolio redesign",
      dueDate: "Tomorrow, 6:00 PM",
      priority: "High",
      status: "Pending",
    },
    timestamp: "9:01 AM",
  },
  {
    id: "3",
    role: "user",
    type: "text",
    content: "What's due today?",
    timestamp: "9:02 AM",
  },
  {
    id: "4",
    role: "ai",
    type: "text",
    content:
      "You have 2 tasks due today:\n• Q3 Report Review — 3:00 PM (Completed ✓)\n• Team Standup — 10:00 AM (Completed ✓)\n\nAll caught up for today 🎉",
    timestamp: "9:02 AM",
  },
];

