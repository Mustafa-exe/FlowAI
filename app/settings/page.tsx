"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import SettingsNav from "@/components/settings/SettingsNav";
import SearchBar from "@/components/settings/SearchBar";
import GeneralSection from "@/components/settings/GeneralSection";
import NotificationsSection from "@/components/settings/NotificationsSection";
import WorkingHoursSection from "@/components/settings/WorkingHoursSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import IntegrationsSection from "@/components/settings/IntegrationsSection";
import SecuritySection from "@/components/settings/SecuritySection";
import SaveBar from "@/components/settings/SaveBar";
import { useThemeMode } from "@/components/theme-provider";
import {
  loadUserPreferences,
  saveUserPreferences,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_WORKING_HOURS,
  DEFAULT_INTEGRATIONS,
  DEFAULT_SECURITY,
  DEFAULT_GENERAL,
  type NotificationPrefs,
  type WorkingHoursPrefs,
  type IntegrationPrefs,
  type SecurityPrefs,
  type GeneralPrefs,
} from "@/lib/userPreferences";

type SaveState = "idle" | "loading" | "success" | "saved";

const sectionMeta = [
  { id: "general",       title: "General",           keywords: ["profile", "name", "email", "language", "date"] },
  { id: "notifications", title: "Notifications",     keywords: ["email", "push", "digest", "reminders", "summary"] },
  { id: "working-hours", title: "Working Hours",     keywords: ["time", "timezone", "days", "schedule"] },
  { id: "appearance",    title: "Appearance",        keywords: ["theme", "font", "compact", "dark", "light"] },
  { id: "integrations",  title: "Integrations",      keywords: ["google", "notion", "slack", "github", "linear"] },
  { id: "security",      title: "Privacy & Security",keywords: ["password", "2fa", "sessions", "export", "delete"] },
] as const;
type SectionId = (typeof sectionMeta)[number]["id"];

const pageVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { themeVariant, compactMode, fontSizePreset } = useThemeMode();

  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimerRef = useRef<number | null>(null);

  // ── Per-section state ──────────────────────────────────────────────────────
  const [general, setGeneral] = useState<GeneralPrefs>(DEFAULT_GENERAL);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);
  const [workingHours, setWorkingHours] = useState<WorkingHoursPrefs>(DEFAULT_WORKING_HOURS);
  const [integrations, setIntegrations] = useState<IntegrationPrefs>(DEFAULT_INTEGRATIONS);
  const [security, setSecurity] = useState<SecurityPrefs>(DEFAULT_SECURITY);

  // ── Load from Firestore on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadUserPreferences(user.uid)
      .then((doc) => {
        setGeneral({
          displayName: doc.general?.displayName ?? user.displayName ?? "",
          language: doc.general?.language ?? DEFAULT_GENERAL.language,
          dateFormat: doc.general?.dateFormat ?? DEFAULT_GENERAL.dateFormat,
          avatarUrl: doc.general?.avatarUrl ?? user.photoURL ?? null,
        });
        if (doc.notifications) setNotifications({ ...DEFAULT_NOTIFICATIONS, ...doc.notifications });
        if (doc.workingHours)  setWorkingHours({ ...DEFAULT_WORKING_HOURS, ...doc.workingHours });
        if (doc.integrations)  setIntegrations({ ...DEFAULT_INTEGRATIONS, ...doc.integrations });
        if (doc.security)      setSecurity({ ...DEFAULT_SECURITY, ...doc.security });
      })
      .catch((err) => console.error("Failed to load preferences:", err))
      .finally(() => setIsLoading(false));
  }, [user]);

  // ── Search filter ──────────────────────────────────────────────────────────
  const visibleSections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return new Set(sectionMeta.map((s) => s.id));
    return new Set(
      sectionMeta
        .filter((s) => `${s.title} ${s.keywords.join(" ")}`.toLowerCase().includes(needle))
        .map((s) => s.id)
    );
  }, [query]);

  const markDirty = () => {
    setHasUnsavedChanges(true);
    if (saveState !== "idle") setSaveState("idle");
  };

  const handleCancel = () => {
    setHasUnsavedChanges(false);
    setSaveState("idle");
  };

  // ── Save ALL sections to Firestore ─────────────────────────────────────────
  const handleSave = async () => {
    setSaveState("loading");
    try {
      if (user) {
        await saveUserPreferences(user.uid, {
          general,
          notifications,
          workingHours,
          integrations,
          security,
          appearance: { themeVariant, compactMode, fontSizePreset },
        });
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }

    setSaveState("success");
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setSaveState("saved");
      setHasUnsavedChanges(false);
      saveTimerRef.current = window.setTimeout(() => setSaveState("idle"), 900);
    }, 700);
  };

  const wrapClass = (id: SectionId) =>
    visibleSections.has(id)
      ? "opacity-100 h-auto pointer-events-auto"
      : "opacity-0 h-0 overflow-hidden pointer-events-none";

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="w-[220px] shrink-0">
        <div className="sticky top-6">
          <SettingsNav />
        </div>
      </div>

      <main className="min-w-0 flex-1">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-slate-200 bg-[#f8fafc]/85 px-4 pb-4 pt-1 backdrop-blur dark:border-white/10 dark:bg-[#111114]/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto max-w-[720px]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Settings</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Preferences</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Manage your account, notifications, and workspace feel.
                </p>
              </div>
              <div className="w-[280px] max-w-[45%]">
                <SearchBar onDebouncedChange={setQuery} />
              </div>
            </div>
          </div>
        </div>

        <motion.div variants={pageVariants} initial="hidden" animate="show" className="mx-auto max-w-[720px] space-y-5">
          <motion.section variants={sectionVariants} id="general" className={`transition-all duration-300 ${wrapClass("general")}`}>
            <GeneralSection
              isLoading={isLoading}
              values={general}
              onChange={(patch) => { setGeneral((p) => ({ ...p, ...patch })); markDirty(); }}
            />
          </motion.section>

          <motion.section variants={sectionVariants} id="notifications" className={`transition-all duration-300 ${wrapClass("notifications")}`}>
            <NotificationsSection
              isLoading={isLoading}
              values={notifications}
              onChange={(patch) => { setNotifications((p) => ({ ...p, ...patch })); markDirty(); }}
            />
          </motion.section>

          <motion.section variants={sectionVariants} id="working-hours" className={`transition-all duration-300 ${wrapClass("working-hours")}`}>
            <WorkingHoursSection
              isLoading={isLoading}
              values={workingHours}
              onChange={(patch) => { setWorkingHours((p) => ({ ...p, ...patch })); markDirty(); }}
            />
          </motion.section>

          <motion.section variants={sectionVariants} id="appearance" className={`transition-all duration-300 ${wrapClass("appearance")}`}>
            <AppearanceSection isLoading={isLoading} onDirty={markDirty} />
          </motion.section>

          <motion.section variants={sectionVariants} id="integrations" className={`transition-all duration-300 ${wrapClass("integrations")}`}>
            <IntegrationsSection
              isLoading={isLoading}
              values={integrations}
              onChange={(patch) => { setIntegrations((p) => ({ ...p, ...patch })); markDirty(); }}
            />
          </motion.section>

          <motion.section variants={sectionVariants} id="security" className={`transition-all duration-300 ${wrapClass("security")}`}>
            <SecuritySection
              isLoading={isLoading}
              values={security}
              onChange={(patch) => { setSecurity((p) => ({ ...p, ...patch })); markDirty(); }}
            />
          </motion.section>
        </motion.div>
      </main>

      <AnimatePresence>
        {hasUnsavedChanges ? (
          <SaveBar saveState={saveState} onCancel={handleCancel} onSave={handleSave} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
