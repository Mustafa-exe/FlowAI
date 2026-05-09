"use client";

/**
 * Temporary test page — DELETE after testing.
 * Visit http://localhost:3000/test-summary while logged in.
 */

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function TestSummaryPage() {
  const [result, setResult] = useState<string>("Loading...");

  useEffect(() => {
    const auth = getAuth(app);

    // Wait for Firebase to restore auth state before checking currentUser
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe(); // only need it once
      try {
        if (!user) {
          setResult("Not logged in. Go to /login first, then come back here.");
          return;
        }
        setResult(`Logged in as: ${user.email}\nFetching summary...`);
        const token = await user.getIdToken();
        const res = await fetch("/api/tasks/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setResult(JSON.stringify(data, null, 2));
      } catch (err) {
        setResult("Error: " + String(err));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "monospace", background: "#111", color: "#0f0", minHeight: "100vh" }}>
      <h1 style={{ color: "#fff", marginBottom: 20 }}>GET /api/tasks/summary — test</h1>
      <pre style={{ fontSize: 16, whiteSpace: "pre-wrap" }}>{result}</pre>
    </div>
  );
}
