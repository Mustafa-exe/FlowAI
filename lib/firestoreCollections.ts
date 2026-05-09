/**
 * Canonical Firestore paths and typed CRUD helpers for all dashboard data.
 *
 * Schema:
 *   users/{uid}/tasks/{taskId}           — Task documents
 *   users/{uid}/calendarEvents/{eventId} — CalendarEvent documents
 *   users/{uid}/chatMessages/{msgId}     — Message documents
 *   users/{uid}/analytics/summary        — AnalyticsDoc (single doc)
 *   users/{uid}/profile/info             — UserProfile
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task } from "@/types/task";
import type { CalendarEvent } from "@/types/calendar";
import type { Message } from "@/types/chat";

// ─── Path helpers ─────────────────────────────────────────────────────────────

const tasksCol     = (uid: string) => collection(db, "users", uid, "tasks");
const taskDoc      = (uid: string, id: string) => doc(db, "users", uid, "tasks", id);
const eventsCol    = (uid: string) => collection(db, "users", uid, "calendarEvents");
const eventDoc     = (uid: string, id: string) => doc(db, "users", uid, "calendarEvents", id);
const chatCol      = (uid: string) => collection(db, "users", uid, "chatMessages");
const analyticsRef = (uid: string) => doc(db, "users", uid, "analytics", "summary");
const profileRef   = (uid: string) => doc(db, "users", uid, "profile", "info");

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserProfile = {
  displayName: string;
  role: string;
  avatarUrl: string | null;
};

export type AnalyticsDoc = {
  productivityScore: number;
  tasksCompleted: number;
  avgFocusMinutes: number;
  weeklyActivity: number[];
  weeklyGoal: number;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_PROFILE: UserProfile = {
  displayName: "User",
  role: "Team Member",
  avatarUrl: null,
};

export const DEFAULT_ANALYTICS: AnalyticsDoc = {
  productivityScore: 0,
  tasksCompleted: 0,
  avgFocusMinutes: 0,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  weeklyGoal: 10, // 10 tasks/week is a reasonable default goal
};

export const SEED_TASKS: Omit<Task, "id">[] = [
  { title: "Portfolio Redesign",   description: "Finalize hero section and export assets",        priority: "High",   status: "Pending",     dueDate: "Tomorrow, 6:00 PM", assignee: "", tags: ["design"] },
  { title: "Q3 Report Review",     description: "Review analytics and prepare summary slide",     priority: "Medium", status: "Pending",     dueDate: "Today, 3:00 PM",    assignee: "", tags: ["reports"] },
  { title: "Team Standup",         description: "Daily sync with product and design team",        priority: "Low",    status: "Completed",   dueDate: "Today, 10:00 AM",   assignee: "", tags: ["meetings"] },
  { title: "Client Proposal",      description: "Send revised pricing proposal to Acme Corp",     priority: "High",   status: "In Progress", dueDate: "Wed, 5:00 PM",      assignee: "", tags: ["clients"] },
  { title: "API Integration",      description: "Connect Zapier webhook to task pipeline",        priority: "Medium", status: "In Progress", dueDate: "Thu, 12:00 PM",     assignee: "", tags: ["dev"] },
  { title: "Design System Update", description: "Update color tokens and component variants",     priority: "Low",    status: "Completed",   dueDate: "Fri, EOD",          assignee: "", tags: ["design"] },
];

export const SEED_EVENTS: Omit<CalendarEvent, "id">[] = [
  { title: "Marketing Sync",   description: "Weekly sync with marketing team", date: getTodayStr(),       startTime: "10:00", endTime: "11:00", type: "meeting", priority: "Medium", completed: false },
  { title: "Portfolio Review", description: "Finalize hero section",           date: getTodayStr(),       startTime: "14:00", endTime: "15:00", type: "task",    priority: "High",   completed: false },
  { title: "Client Call",      description: "Revised pricing discussion",      date: getOffsetStr(1),     startTime: "12:00", endTime: "13:00", type: "meeting", priority: "High",   completed: false },
  { title: "Focus Block",      description: "Deep work — no interruptions",    date: getOffsetStr(2),     startTime: "10:00", endTime: "12:00", type: "focus",   priority: "Low",    completed: false },
  { title: "Sprint Planning",  description: "Q2 sprint kickoff",               date: getOffsetStr(3),     startTime: "14:00", endTime: "16:00", type: "meeting", priority: "High",   completed: false },
];

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}
function getOffsetStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function snapToTasks(snap: import("firebase/firestore").QuerySnapshot): Task[] {
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Task, "id">) }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function snapToEvents(snap: import("firebase/firestore").QuerySnapshot): CalendarEvent[] {
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarEvent, "id">) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function snapToMessages(snap: import("firebase/firestore").QuerySnapshot): Message[] {
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function loadProfile(uid: string): Promise<UserProfile> {
  try {
    const snap = await getDoc(profileRef(uid));
    if (!snap.exists()) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...(snap.data() as Partial<UserProfile>) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  await setDoc(profileRef(uid), patch, { merge: true });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
// Strategy: getDocs for initial load (no index needed), then onSnapshot for
// real-time updates. This avoids the composite-index requirement of orderBy.

export function subscribeToTasks(uid: string, cb: (tasks: Task[]) => void): Unsubscribe {
  const unsub = onSnapshot(
    tasksCol(uid),
    (snap) => {
      // Always deliver whatever is in Firestore — empty is valid for new users
      if (!snap.empty) {
        cb(snapToTasks(snap));
      } else {
        cb([]); // new user, no tasks yet
      }
    },
    (error) => {
      console.error("Tasks listener error:", error.code, error.message);
      cb([]);
    }
  );

  return unsub;
}

export async function addTask(uid: string, task: Omit<Task, "id">): Promise<string> {
  const ref = await addDoc(tasksCol(uid), task);
  return ref.id;
}

/** Removes auto-seeded demo tasks (those matching the SEED_TASKS titles) */
export async function clearSeedTasks(uid: string): Promise<void> {
  const seedTitles = new Set(SEED_TASKS.map((t) => t.title));
  const snap = await getDocs(tasksCol(uid));
  const stale = snap.docs.filter((d) => seedTitles.has((d.data() as Task).title));
  if (stale.length > 0) {
    await Promise.all(stale.map((d) => deleteDoc(d.ref)));
  }
}

export async function updateTask(uid: string, id: string, patch: Partial<Omit<Task, "id">>): Promise<void> {
  await updateDoc(taskDoc(uid, id), patch);
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  await deleteDoc(taskDoc(uid, id));
}

// ─── Calendar Events ──────────────────────────────────────────────────────────
// No seed data — users create their own events via "Add Event"

export function subscribeToEvents(uid: string, cb: (events: CalendarEvent[]) => void): Unsubscribe {
  return onSnapshot(
    eventsCol(uid),
    (snap) => {
      // Always deliver whatever is in Firestore — empty is valid
      cb(snapToEvents(snap));
    },
    (error) => {
      console.error("Events listener error:", error.code, error.message);
      cb([]);
    }
  );
}

export async function addEvent(uid: string, event: Omit<CalendarEvent, "id">): Promise<string> {
  const ref = await addDoc(eventsCol(uid), event);
  return ref.id;
}

export async function updateEvent(uid: string, id: string, patch: Partial<Omit<CalendarEvent, "id">>): Promise<void> {
  await updateDoc(eventDoc(uid, id), patch);
}

export async function deleteEvent(uid: string, id: string): Promise<void> {
  await deleteDoc(eventDoc(uid, id));
}

/** Removes all seeded demo events (those with titles matching the seed list) */
export async function clearSeedEvents(uid: string): Promise<void> {
  const seedTitles = new Set(SEED_EVENTS.map((e) => e.title));
  const snap = await getDocs(eventsCol(uid));
  const stale = snap.docs.filter((d) => seedTitles.has((d.data() as CalendarEvent).title));
  await Promise.all(stale.map((d) => deleteDoc(d.ref)));
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export function subscribeToChatMessages(uid: string, cb: (msgs: Message[]) => void): Unsubscribe {
  return onSnapshot(
    chatCol(uid),
    (snap) => {
      cb(snapToMessages(snap));
    },
    (error) => {
      console.error("Chat listener error:", error.code, error.message);
      cb([]);
    }
  );
}

export async function addChatMessage(uid: string, msg: Omit<Message, "id">): Promise<string> {
  const ref = await addDoc(chatCol(uid), msg);
  return ref.id;
}

export async function clearChatMessages(uid: string): Promise<void> {
  const snap = await getDocs(chatCol(uid));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function subscribeToAnalytics(uid: string, cb: (data: AnalyticsDoc) => void): Unsubscribe {
  return onSnapshot(
    analyticsRef(uid),
    async (snap) => {
      if (!snap.exists()) {
        cb(DEFAULT_ANALYTICS);
        // Write defaults in background — non-blocking
        setDoc(analyticsRef(uid), DEFAULT_ANALYTICS).catch(() => {});
        return;
      }
      cb({ ...DEFAULT_ANALYTICS, ...(snap.data() as Partial<AnalyticsDoc>) });
    },
    (error) => {
      console.error("Analytics listener error:", error.code, error.message);
      cb(DEFAULT_ANALYTICS);
    }
  );
}

export async function updateAnalytics(uid: string, patch: Partial<AnalyticsDoc>): Promise<void> {
  await setDoc(analyticsRef(uid), patch, { merge: true });
}
