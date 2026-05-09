/**
 * Browser push notifications for tasks due within the next 24 hours.
 * Called once on dashboard load.
 */

import type { Task } from "@/types/task";

// Module-level map to avoid scheduling duplicate notifications
const scheduledTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Requests browser notification permission.
 * Returns true if permission is granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Schedules browser notifications for tasks due within the next 24 hours
 * that are not completed. Uses setTimeout to fire at the due time,
 * or immediately if the task is due in less than 5 minutes.
 */
export function scheduleTaskNotifications(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const now = Date.now();
  const in24Hours = now + 24 * 60 * 60 * 1000;
  const fiveMinutes = 5 * 60 * 1000;

  for (const task of tasks) {
    // Skip completed tasks
    if (task.status === "Completed") continue;

    // Only process tasks with ISO-format dueDate
    if (!task.dueDate || !/^\d{4}-\d{2}-\d{2}/.test(task.dueDate)) continue;

    const dueTime = new Date(task.dueDate).getTime();
    if (isNaN(dueTime)) continue;

    // Only notify for tasks due within the next 24 hours
    if (dueTime < now || dueTime > in24Hours) continue;

    // Skip if already scheduled for this task
    if (scheduledTimeouts.has(task.id)) continue;

    const delay = dueTime - now;
    const fireImmediately = delay < fiveMinutes;

    const timeoutId = setTimeout(
      () => {
        scheduledTimeouts.delete(task.id);

        const dueAt = new Date(task.dueDate);
        const timeStr = dueAt.toLocaleTimeString("en", {
          hour: "numeric",
          minute: "2-digit",
        });

        try {
          new Notification(`Task Due: ${task.title}`, {
            body: `Due at ${timeStr}`,
            icon: "/favicon.ico",
            tag: `task-${task.id}`,
          });
        } catch (err) {
          console.warn("Failed to show notification:", err);
        }
      },
      fireImmediately ? 0 : delay
    );

    scheduledTimeouts.set(task.id, timeoutId);
  }
}

/**
 * Cancels all scheduled task notifications.
 * Useful when the user signs out or the component unmounts.
 */
export function clearTaskNotifications(): void {
  for (const timeoutId of scheduledTimeouts.values()) {
    clearTimeout(timeoutId);
  }
  scheduledTimeouts.clear();
}
