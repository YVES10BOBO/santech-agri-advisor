"use client";

import { useEffect, useRef, useState } from "react";
import LanguageToggle from "./LanguageToggle";
import MessageBubble from "./MessageBubble";
import ThinkingIndicator from "./ThinkingIndicator";
import { askQuestion, askWithPhoto } from "@/lib/api";
import { starterQuestions, strings } from "@/lib/strings";
import type { ChatMessage, Language } from "@/lib/types";

let counter = 0;
const newId = () => `m${Date.now()}-${counter++}`;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export default function ChatWindow() {
  const [language, setLanguage] = useState<Language>("rw");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [photoError, setPhotoError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = strings[language];

  useEffect(() => {
    if (messages.length === 0 && !loading) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function choosePhoto(file: File | undefined) {
    setPhotoError("");
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t.photoTooBig);
      return;
    }
    setPhoto({ file, url: URL.createObjectURL(file) });
  }

  function clearPhoto() {
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(question: string) {
    const q = question.trim();
    const sentPhoto = photo;
    if ((!q && !sentPhoto) || loading) return;
    setInput("");
    clearPhoto();
    setMessages((m) => [
      ...m,
      { id: newId(), role: "farmer", text: q || t.photoOnly, imageUrl: sentPhoto?.url },
    ]);
    setLoading(true);
    setLoadingPhoto(Boolean(sentPhoto));
    try {
      const res = sentPhoto
        ? await askWithPhoto(sentPhoto.file, q, language, sessionId)
        : await askQuestion(q, language, sessionId);
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
    clearPhoto();
  }

  const steps = loadingPhoto
    ? [
        { after: 0, text: t.stepPhoto },
        { after: 5, text: t.stepSearch },
        { after: 8, text: t.stepWrite },
        { after: 30, text: t.stepSlow },
      ]
    : [
        { after: 0, text: t.stepRead },
        { after: 2, text: t.stepSearch },
        { after: 5, text: t.stepWrite },
        { after: 25, text: t.stepSlow },
      ];

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

        {loading && <ThinkingIndicator steps={steps} />}
        <div ref={endRef} />
      </main>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        {(photo || photoError) && (
          <div className="photo-preview">
            {photo && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={t.photoOnly} />
                <button type="button" className="link-button" onClick={clearPhoto}>
                  {t.removePhoto}
                </button>
              </>
            )}
            {photoError && <p className="photo-error">{photoError}</p>}
          </div>
        )}
        <div className="composer-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="visually-hidden"
            id="photo"
            onChange={(e) => choosePhoto(e.target.files?.[0])}
          />
          <label
            htmlFor="photo"
            className="photo-button"
            title={t.addPhoto}
            aria-label={t.addPhoto}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
              />
            </svg>
          </label>
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
          <button type="submit" disabled={loading || (!input.trim() && !photo)}>
            {t.send}
          </button>
        </div>
      </form>
    </div>
  );
}
