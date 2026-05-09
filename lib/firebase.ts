import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAy-hZkF39LrKhJ4TW5n0OYm24fxg6IHRw",
  authDomain: "flowai-968d4.firebaseapp.com",
  projectId: "flowai-968d4",
  storageBucket: "flowai-968d4.firebasestorage.app",
  messagingSenderId: "170701155474",
  appId: "1:170701155474:web:7521d8d9d83811d6a38a4b",
  measurementId: "G-T5D5MNK10V",
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics: Analytics | null = null;

export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  if (analytics) return analytics;
  const supported = await isSupported();
  if (!supported) return null;
  analytics = getAnalytics(app);
  return analytics;
}

export { app, auth, db, storage };
