"use client";

import { useEffect, useRef, useState } from "react";
import LanguageToggle from "./LanguageToggle";
import MessageBubble from "./MessageBubble";
import { askQuestion } from "@/lib/api";
import { starterQuestions, strings } from "@/lib/strings";
import type { ChatMessage, Language } from "@/lib/types";

let counter = 0;
const newId = () => `m${Date.now()}-${counter++}`;

export default function ChatWindow() {
  const [language, setLanguage] = useState<Language>("rw");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const t = strings[language];

  useEffect(() => {
    if (messages.length === 0 && !loading) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: newId(), role: "farmer", text: q }]);
    setLoading(true);
    try {
      const res = await askQuestion(q, language, sessionId);
      setSessionId(res.session_id);
      setMessages((m) => [
        ...m,
        { id: newId(), role: "advisor", text: res.answer, response: res },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { id: newId(), role: "advisor", text: t.error, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setSessionId(null);
    setInput("");
  }

  return (
    <div className="app">
      <header className="terraces">
        <div className="header-inner">
          <div>
            <h1>{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
          <div className="header-actions">
            <LanguageToggle value={language} onChange={setLanguage} />
            {messages.length > 0 && (
              <button type="button" className="link-button" onClick={reset}>
                {t.newChat}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="conversation" aria-live="polite">
        {messages.length === 0 && (
          <section className="starters">
            <h2>{t.tryThese}</h2>
            <ul>
              {starterQuestions[language].map((q) => (
                <li key={q}>
                  <button type="button" onClick={() => send(q)}>
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} uiLanguage={language} />
        ))}

        {loading && (
          <p className="thinking" role="status">
            <span className="dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {t.thinking}
          </p>
        )}
        <div ref={endRef} />
      </main>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="question" className="visually-hidden">
          {t.placeholder}
        </label>
        <textarea
          id="question"
          value={input}
          rows={2}
          placeholder={t.placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {t.send}
        </button>
      </form>
    </div>
  );
}
