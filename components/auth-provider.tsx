"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveGCalToken, removeGCalToken, loadGCalToken, isTokenValid, type GCalTokenDoc } from "@/lib/googleCalendar";

type AuthContextValue = {
  user: User | null;
  isAuthReady: boolean;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<User>;
  /** Request Google Calendar OAuth scope and store the access token */
  connectGoogleCalendar: () => Promise<void>;
  /** Disconnect Google Calendar — removes stored token */
  disconnectGoogleCalendar: () => Promise<void>;
  /** Get a valid Google Calendar access token, or null if not connected */
  getGCalToken: () => Promise<string | null>;
  isGCalConnected: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isGCalConnected, setIsGCalConnected] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthReady(true);

      // Check if Google Calendar is connected for this user
      if (nextUser) {
        loadGCalToken(nextUser.uid).then((token) => {
          setIsGCalConnected(!!token && isTokenValid(token));
        }).catch(() => setIsGCalConnected(false));
      } else {
        setIsGCalConnected(false);
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthReady,
      isGCalConnected,

      signOutUser: async () => {
        await signOut(auth);
      },

      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        provider.addScope("profile");
        provider.addScope("email");
        await signInWithPopup(auth, provider);
      },

      signInWithEmail: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },

      signUpWithEmail: async (email: string, password: string, displayName?: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        return cred.user;
      },

      connectGoogleCalendar: async () => {
        const provider = new GoogleAuthProvider();
        provider.addScope("https://www.googleapis.com/auth/calendar");
        provider.addScope("https://www.googleapis.com/auth/calendar.events");
        // Force account selection so user can pick the right Google account
        provider.setCustomParameters({ prompt: "consent" });

        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;

        if (!accessToken || !result.user) {
          throw new Error("Failed to get Google Calendar access token");
        }

        // Store token in Firestore — expires in ~1 hour
        const tokenDoc: GCalTokenDoc = {
          accessToken,
          calendarId: "primary",
          connectedAt: new Date().toISOString(),
          expiresAt: Date.now() + 55 * 60 * 1000, // 55 min (conservative)
        };
        await saveGCalToken(result.user.uid, tokenDoc);
        setIsGCalConnected(true);
      },

      disconnectGoogleCalendar: async () => {
        if (!user) return;
        await removeGCalToken(user.uid);
        setIsGCalConnected(false);
      },

      getGCalToken: async () => {
        if (!user) return null;
        const token = await loadGCalToken(user.uid);
        if (!token) return null;
        if (!isTokenValid(token)) {
          // Token expired — mark as disconnected
          setIsGCalConnected(false);
          return null;
        }
        return token.accessToken;
      },
    }),
    [user, isAuthReady, isGCalConnected]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
