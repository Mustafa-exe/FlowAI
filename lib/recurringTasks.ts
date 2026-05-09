/**
 * Processes recurring task rules for a given user and generates
 * any tasks that are due today but haven't been generated yet.
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RecurringRule {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;   // 0-6 for weekly
  dayOfMonth?: number;  // 1-31 for monthly
  time: string;         // "HH:MM"
  active: boolean;
  lastGenerated?: string; // ISO date "YYYY-MM-DD"
  createdAt: string;
}

/**
 * Checks whether a recurring rule should generate a task today.
 */
function shouldGenerateToday(rule: RecurringRule, today: Date): boolean {
  switch (rule.frequency) {
    case "daily":
      return true;

    case "weekly":
      // dayOfWeek: 0 = Sunday, 6 = Saturday
      return rule.dayOfWeek !== undefined
        ? today.getDay() === rule.dayOfWeek
        : true;

    case "monthly":
      return rule.dayOfMonth !== undefined
        ? today.getDate() === rule.dayOfMonth
        : true;

    default:
      return false;
  }
}

/**
 * Fetches all active recurring rules for a user, generates tasks for
 * rules that are due today and haven't been generated yet, and returns
 * the count of tasks generated.
 */
export async function processRecurringRules(uid: string): Promise<number> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const rulesSnap = await getDocs(
    collection(db, "users", uid, "recurringRules")
  );

  const rules: RecurringRule[] = rulesSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<RecurringRule, "id">),
  }));

  const activeRules = rules.filter((r) => r.active);
  let generated = 0;

  for (const rule of activeRules) {
    // Skip if already generated today
    if (rule.lastGenerated === todayStr) continue;

    // Check if this rule fires today
    if (!shouldGenerateToday(rule, today)) continue;

    // Build the due date/time for the generated task
    const dueDate = `${todayStr}T${rule.time}`;

    // Create the task in Firestore
    await addDoc(collection(db, "users", uid, "tasks"), {
      title: rule.title,
      description: rule.description,
      priority: rule.priority,
      status: "Pending",
      dueDate,
      assignee: "",
      tags: ["recurring"],
    });

    // Update lastGenerated on the rule
    await updateDoc(doc(db, "users", uid, "recurringRules", rule.id), {
      lastGenerated: todayStr,
    });

    generated++;
  }

  return generated;
}
