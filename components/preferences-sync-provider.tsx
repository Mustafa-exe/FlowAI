"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useThemeMode, type FontSizePreset, type ThemeVariant } from "@/components/theme-provider";
import { db } from "@/lib/firebase";

type PreferenceDoc = {
  themeVariant?: ThemeVariant;
  compactMode?: boolean;
  fontSizePreset?: FontSizePreset;
  updatedAt?: string;
};

// Single canonical path used by both this provider and settings/page.tsx
const PREFS_PATH = (uid: string) => doc(db, "users", uid, "preferences", "workspace");

export function PreferencesSyncProvider({ children }: { children: ReactNode }) {
  const { user, isAuthReady } = useAuth();
  const { themeVariant, setThemeVariant, compactMode, setCompactMode, fontSizePreset, setFontSizePreset } =
    useThemeMode();
  const hydratedRef = useRef(false);
  const skipInitialWriteRef = useRef(true);

  // Hydrate from Firestore on first authenticated load
  useEffect(() => {
    const run = async () => {
      if (!isAuthReady || !user || hydratedRef.current) return;
      try {
        const snap = await getDoc(PREFS_PATH(user.uid));
        if (snap.exists()) {
          const data = snap.data() as PreferenceDoc;
          if (data.themeVariant) setThemeVariant(data.themeVariant);
          if (typeof data.compactMode === "boolean") setCompactMode(data.compactMode);
          if (data.fontSizePreset) setFontSizePreset(data.fontSizePreset);
        } else {
          await setDoc(PREFS_PATH(user.uid), {
            themeVariant,
            compactMode,
            fontSizePreset,
            updatedAt: new Date().toISOString(),
          } satisfies PreferenceDoc);
        }
      } catch (error) {
        console.error("Failed to hydrate cloud preferences:", error);
      } finally {
        hydratedRef.current = true;
      }
    };
    void run();
  }, [isAuthReady, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist changes back to Firestore (skip the first render after hydration)
  useEffect(() => {
    const run = async () => {
      if (!isAuthReady || !user || !hydratedRef.current) return;
      if (skipInitialWriteRef.current) {
        skipInitialWriteRef.current = false;
        return;
      }
      try {
        await setDoc(
          PREFS_PATH(user.uid),
          {
            themeVariant,
            compactMode,
            fontSizePreset,
            updatedAt: new Date().toISOString(),
          } satisfies PreferenceDoc,
          { merge: true }
        );
      } catch (error) {
        console.error("Failed to persist cloud preferences:", error);
      }
    };
    void run();
  }, [themeVariant, compactMode, fontSizePreset, isAuthReady, user]);

  return <>{children}</>;
}
