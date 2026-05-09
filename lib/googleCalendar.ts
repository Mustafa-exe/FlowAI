/**
 * Google Calendar API client — browser-side.
 *
 * Uses the OAuth access token obtained via Firebase's signInWithPopup
 * with the calendar scope. The token is stored in Firestore so it
 * persists across sessions (until it expires ~1 hour).
 *
 * Firestore path: users/{uid}/integrations/googleCalendar
 *   { accessToken, calendarId, connectedAt, expiresAt }
 */

import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GCAL_BASE = "https://www.googleapis.com/calendar/v3";

export type GCalTokenDoc = {
  accessToken: string;
  calendarId: string; // "primary" by default
  connectedAt: string;
  expiresAt: number; // Unix ms
};

// ─── Firestore helpers ────────────────────────────────────────────────────────

const tokenRef = (uid: string) =>
  doc(db, "users", uid, "integrations", "googleCalendar");

export async function saveGCalToken(uid: string, token: GCalTokenDoc): Promise<void> {
  await setDoc(tokenRef(uid), token);
}

export async function loadGCalToken(uid: string): Promise<GCalTokenDoc | null> {
  const snap = await getDoc(tokenRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as GCalTokenDoc;
}

export async function removeGCalToken(uid: string): Promise<void> {
  await deleteDoc(tokenRef(uid));
}

export function isTokenValid(token: GCalTokenDoc): boolean {
  // Consider expired if less than 5 minutes remain
  return Date.now() < token.expiresAt - 5 * 60 * 1000;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function gcalFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<any> {
  const res = await fetch(`${GCAL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Google Calendar API error ${res.status}`);
  }

  if (res.status === 204) return null; // DELETE responses
  return res.json();
}

// ─── Calendar operations ──────────────────────────────────────────────────────

/** List upcoming events from the user's primary calendar */
export async function listUpcomingEvents(
  accessToken: string,
  calendarId = "primary",
  maxResults = 20
): Promise<any[]> {
  const timeMin = new Date().toISOString();
  const params = new URLSearchParams({
    timeMin,
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
  });
  const data = await gcalFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    accessToken
  );
  return data?.items ?? [];
}

/** Create a new event in Google Calendar from a FlowAI task */
export async function createCalendarEvent(
  accessToken: string,
  task: {
    title: string;
    description: string;
    dueDate: string; // ISO datetime "2026-05-22T23:03" or date "2026-05-22"
    priority: string;
  },
  calendarId = "primary"
): Promise<string | null> {
  // Parse the dueDate into a proper RFC3339 datetime
  let startDateTime: string;
  let endDateTime: string;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(task.dueDate)) {
    // Full datetime
    const start = new Date(task.dueDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
    startDateTime = start.toISOString();
    endDateTime = end.toISOString();
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
    // Date only — use as all-day event
    const body = {
      summary: `[FlowAI] ${task.title}`,
      description: `${task.description}\n\nPriority: ${task.priority}\nCreated by FlowAI`,
      start: { date: task.dueDate },
      end: { date: task.dueDate },
      colorId: task.priority === "High" ? "11" : task.priority === "Medium" ? "5" : "2",
    };
    const data = await gcalFetch(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      accessToken,
      { method: "POST", body: JSON.stringify(body) }
    );
    return data?.id ?? null;
  } else {
    // Fallback: use today
    const start = new Date();
    start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    startDateTime = start.toISOString();
    endDateTime = end.toISOString();
  }

  const body = {
    summary: `[FlowAI] ${task.title}`,
    description: `${task.description}\n\nPriority: ${task.priority}\nCreated by FlowAI`,
    start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    // Color: red=High, yellow=Medium, green=Low
    colorId: task.priority === "High" ? "11" : task.priority === "Medium" ? "5" : "2",
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 30 }],
    },
  };

  const data = await gcalFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    accessToken,
    { method: "POST", body: JSON.stringify(body) }
  );
  return data?.id ?? null;
}

/** Delete a Google Calendar event by its event ID */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = "primary"
): Promise<void> {
  await gcalFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    { method: "DELETE" }
  );
}

/** Verify the token works by fetching the calendar list */
export async function verifyCalendarAccess(accessToken: string): Promise<boolean> {
  try {
    await gcalFetch("/users/me/calendarList?maxResults=1", accessToken);
    return true;
  } catch {
    return false;
  }
}
