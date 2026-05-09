/**
 * Gemini AI client — uses the free Google Generative Language REST API.
 * Model: gemini-2.0-flash (free tier, fast, confirmed available)
 */

const MODEL = "gemini-3-flash-preview";
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type GeminiMessage = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

export type GeminiResponse = {
  text: string;
  raw: unknown;
};

export async function geminiChat(
  history: GeminiMessage[],
  message: string,
  systemPrompt?: string
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const contents: GeminiMessage[] = [
    ...history,
    { role: "user", parts: [{ text: message }] },
  ];

  const body: Record<string, unknown> = { contents };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error?.message ?? `Gemini API error ${res.status}`
    );
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return { text, raw: data };
}
