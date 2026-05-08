export type MessageRole = "user" | "ai" | "system";
export type MessageType = "text" | "task-card" | "thinking" | "system" | "multi-step";

export interface TaskCardData {
  title: string;
  description: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
}

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content?: string;
  taskCard?: TaskCardData;
  timestamp: string;
}

export interface MultiStepState {
  active: boolean;
  currentStep: number;
  totalSteps: number;
  answers: Record<string, string>;
}

