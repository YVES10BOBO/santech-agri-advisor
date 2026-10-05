import type { AskResponse, Language } from "./types";

export async function askQuestion(
  question: string,
  language: Language,
  sessionId: string | null,
): Promise<AskResponse> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, language, session_id: sessionId }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Request failed (${res.status}): ${detail}`);
  }
  return res.json();
}

export async function askWithPhoto(
  photo: File,
  question: string,
  language: Language,
  sessionId: string | null,
): Promise<AskResponse> {
  const form = new FormData();
  form.append("image", photo);
  form.append("question", question);
  form.append("language", language);
  if (sessionId) form.append("session_id", sessionId);
  const res = await fetch("/api/ask-image", { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Request failed (${res.status}): ${detail}`);
  }
  return res.json();
}

export async function transcribeAudio(
  audio: Blob,
  language: Language,
): Promise<{ text: string; latency_ms: number }> {
  const form = new FormData();
  form.append("audio", audio, "question.wav");
  form.append("language", language);
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Request failed (${res.status}): ${detail}`);
  }
  return res.json();
}
