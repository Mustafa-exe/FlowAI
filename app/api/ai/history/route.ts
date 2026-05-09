/**
 * GET /api/ai/history
 *
 * Cursor-based paginated chat history for the authenticated user.
 *
 * Query params:
 *   cursor?   string  — Firestore doc ID to start after
 *   pageSize? number  — messages per page (default 20, max 50)
 *
 * Response:
 *   messages    Message[]  — paginated messages (newest first)
 *   nextCursor  string | null
 *   total       number     — approximate count
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor");
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10),
    MAX_PAGE_SIZE
  );

  try {
    const chatCol = collection(db, "users", uid, "chatMessages");
    let q = query(chatCol, orderBy("timestamp", "desc"), limit(pageSize));

    if (cursor) {
      const cursorDoc = await getDoc(doc(chatCol, cursor));
      if (cursorDoc.exists()) {
        q = query(chatCol, orderBy("timestamp", "desc"), startAfter(cursorDoc), limit(pageSize));
      }
    }

    const snap = await getDocs(q);
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === pageSize
      ? snap.docs[snap.docs.length - 1].id
      : null;

    return NextResponse.json({ messages, nextCursor, count: messages.length });
  } catch (err) {
    console.error("[GET /api/ai/history]", err);
    return NextResponse.json({ error: "Failed to fetch chat history." }, { status: 500 });
  }
}
