// Conversation history, kept in this browser only (localStorage). Photos are not kept:
// their preview links stop working after the page is reloaded.
import type { ChatMessage, Language } from "./types";

export interface Conversation {
  id: string;
  title: string;
  sessionId: string | null;
  language: Language;
  updatedAt: number;
  messages: ChatMessage[];
}

const KEY = "santech-conversations-v1";
const MAX_CONVERSATIONS = 30;

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Conversation[]) : [];
    return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function saveConversations(list: Conversation[]): void {
  const trimmed = list
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS)
    .map((c) => ({
      ...c,
      messages: c.messages.map(({ imageUrl, ...m }) => ({ ...m, hadPhoto: m.hadPhoto || Boolean(imageUrl) })),
    }));
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or blocked (private mode): history is simply not kept.
  }
}

export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 48 ? `${clean.slice(0, 45)}…` : clean;
}
