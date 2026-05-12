export type Priority = "High" | "Medium" | "Low";
export type Status = "Backlog" | "Pending" | "In Progress" | "Completed";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  assignee: string;
  tags: string[];
  subtasks?: Subtask[];
}
