/**
 * GET /api/ai/chat/history
 *
 * Returns paginated chat history using cursor-based pagination.
 * Better performance than offset at scale — no full collection scan.
 *
 * Query params:
 *   limit?   number  — messages per page (default 20, max 50)
 *   cursor?  string  — Firestore document ID to start after (for next page)
 *
 * Response:
 *   messages    array         — chat messages newest-first
 *   next_cursor string|null   — pass as ?cursor= for the next page (null = no more)
 *   has_more    boolean
 *
 * DELETE /api/ai/chat/history — clears all chat history for the user
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { clearCache } from "@/lib/chatCache";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 50;

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = req.nextUrl;
    const rawLimit  = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const pageLimit = Math.min(isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit, MAX_LIMIT);
    const cursor    = searchParams.get("cursor");

    const chatCol = collection(db, "users", uid, "chatMessages");

    // Build cursor-based query
    let q = query(chatCol, orderBy("created_at", "desc"), limit(pageLimit + 1));

    if (cursor) {
      const cursorDoc = await getDoc(doc(chatCol, cursor));
      if (cursorDoc.exists()) {
        q = query(chatCol, orderBy("created_at", "desc"), startAfter(cursorDoc), limit(pageLimit + 1));
      }
    }

    const snap = await getDocs(q);
    const docs = snap.docs;

    const hasMore    = docs.length > pageLimit;
    const pageDocs   = hasMore ? docs.slice(0, pageLimit) : docs;
    const nextCursor = hasMore ? pageDocs[pageDocs.length - 1].id : null;

    const messages = pageDocs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ messages, next_cursor: nextCursor, has_more: hasMore });
  } catch (err) {
    console.error("[GET /api/ai/chat/history]", err);
    return NextResponse.json({ error: "Failed to fetch chat history." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const uid = req.headers.get("x-user-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const chatCol = collection(db, "users", uid, "chatMessages");
    const snap    = await getDocs(chatCol);

    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

    // Also clear in-memory cache
    clearCache(uid);

    return NextResponse.json({
      message: `Deleted ${snap.docs.length} messages.`,
      deleted: snap.docs.length,
    });
  } catch (err) {
    console.error("[DELETE /api/ai/chat/history]", err);
    return NextResponse.json({ error: "Failed to clear chat history." }, { status: 500 });
  }
}
