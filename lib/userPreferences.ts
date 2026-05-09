import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ThemeVariant, FontSizePreset } from "@/components/theme-provider";

// ─── Firestore document shape ────────────────────────────────────────────────
// Path: users/{uid}/preferences/workspace

export type NotificationPrefs = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  taskReminders: boolean;
  dailySummaryTime: string; // "HH:MM"
};

export type WorkingHoursPrefs = {
  start: string;          // "HH:MM"
  end: string;            // "HH:MM"
  activeDays: string[];   // ["Mon","Tue",...]
  pauseOutside: boolean;
  timezone: string;
};

export type IntegrationPrefs = Record<string, boolean>; // name → connected

export type SecurityPrefs = {
  twoFA: boolean;
};

export type GeneralPrefs = {
  displayName: string;
  language: string;
  dateFormat: string;
  avatarUrl: string | null;
};

export type UserPreferencesDoc = {
  general?: GeneralPrefs;
  notifications?: NotificationPrefs;
  workingHours?: WorkingHoursPrefs;
  integrations?: IntegrationPrefs;
  security?: SecurityPrefs;
  appearance?: {
    themeVariant: ThemeVariant;
    compactMode: boolean;
    fontSizePreset: FontSizePreset;
  };
  updatedAt?: string;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: false,
  taskReminders: true,
  dailySummaryTime: "07:00",
};

export const DEFAULT_WORKING_HOURS: WorkingHoursPrefs = {
  start: "08:00",
  end: "18:00",
  activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  pauseOutside: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Karachi",
};

export const DEFAULT_INTEGRATIONS: IntegrationPrefs = {
  "Google Calendar": false,
  "Notion": false,
  "Slack": false,
  "GitHub": false,
  "Linear": false,
};

export const DEFAULT_SECURITY: SecurityPrefs = {
  twoFA: false,
};

export const DEFAULT_GENERAL: GeneralPrefs = {
  displayName: "",
  language: "English (US)",
  dateFormat: "MM/DD/YYYY",
  avatarUrl: null,
};

// ─── Firestore helpers ────────────────────────────────────────────────────────

const prefsRef = (uid: string) =>
  doc(db, "users", uid, "preferences", "workspace");

export async function loadUserPreferences(uid: string): Promise<UserPreferencesDoc> {
  const snap = await getDoc(prefsRef(uid));
  if (!snap.exists()) return {};
  return snap.data() as UserPreferencesDoc;
}

export async function saveUserPreferences(
  uid: string,
  patch: Partial<UserPreferencesDoc>
): Promise<void> {
  await setDoc(
    prefsRef(uid),
    { ...patch, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}
