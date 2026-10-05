"use client";

import { useEffect, useRef, useState } from "react";
import LanguageToggle from "./LanguageToggle";
import MessageBubble from "./MessageBubble";
import MicButton from "./MicButton";
import Sidebar from "./Sidebar";
import Icon from "./Icon";
import ThinkingIndicator from "./ThinkingIndicator";
import { askQuestion, askWithPhoto } from "@/lib/api";
import { loadConversations, saveConversations, titleFrom, type Conversation } from "@/lib/history";
import { starterQuestions, strings, USSD_CODE, type Crop } from "@/lib/strings";
import type { ChatMessage, Language } from "@/lib/types";

let counter = 0;
const newId = () => `m${Date.now()}-${counter++}`;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const CROPS: Crop[] = ["maize", "beans", "potato"];

export default function ChatWindow() {
  const [language, setLanguage] = useState<Language>("rw");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = strings[language];

  useEffect(() => setConversations(loadConversations()), []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (messages.length === 0 && !loading) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // Keep the active conversation saved after every new message.
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    setConversations((list) => {
      const others = list.filter((c) => c.id !== activeId);
      const current = list.find((c) => c.id === activeId);
      const firstQuestion = messages.find((m) => m.role === "farmer")?.text ?? t.newChat;
      const updated: Conversation = {
        id: activeId,
        title: current?.title ?? titleFrom(firstQuestion),
        sessionId,
        language,
        updatedAt: Date.now(),
        messages,
      };
      const next = [updated, ...others];
      saveConversations(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sessionId]);

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
    if (!activeId) setActiveId(`c${Date.now()}`);
    setInput("");
    setVoiceStatus("");
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
      setMessages((m) => [...m, { id: newId(), role: "advisor", text: res.answer, response: res }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { id: newId(), role: "advisor", text: t.error, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setSessionId(null);
    setActiveId(null);
    setInput("");
    setVoiceStatus("");
    clearPhoto();
    setMenuOpen(false);
  }

  function openConversation(id: string) {
    const c = conversations.find((x) => x.id === id);
    if (!c || loading) return;
    setActiveId(c.id);
    setMessages(c.messages);
    setSessionId(c.sessionId);
    setLanguage(c.language);
    setMenuOpen(false);
  }

  function deleteConversation(id: string) {
    const next = conversations.filter((c) => c.id !== id);
    setConversations(next);
    saveConversations(next);
    if (id === activeId) newConversation();
  }

  const active = conversations.find((c) => c.id === activeId);
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
    <div className="shell">
      <Sidebar
        t={t}
        language={language}
        open={menuOpen}
        conversations={conversations}
        activeId={activeId}
        onNew={newConversation}
        onOpen={openConversation}
        onDelete={deleteConversation}
        onClose={() => setMenuOpen(false)}
      />

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-button menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label={t.openMenu}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
            </svg>
          </button>
          <div className="topbar-title">
            <h1>{active?.title ?? t.brand}</h1>
            <p className="status">
              <span className="status-dot" aria-hidden="true" />
              {t.online}
            </p>
          </div>
          <LanguageToggle value={language} onChange={setLanguage} />
        </header>

        <main className="conversation" aria-live="polite">
          <div className="conversation-inner">
            {messages.length === 0 && (
              <section className="welcome">
                <div className="welcome-avatar" aria-hidden="true">
                  <Icon name="leaf" size={34} />
                </div>
                <h2>{t.welcomeTitle}</h2>
                <p className="welcome-text">{t.welcomeText}</p>
                <ul className="capabilities">
                  <li>
                    <Icon name="type" /> {t.capType}
                  </li>
                  <li>
                    <Icon name="mic" /> {t.capSpeak}
                  </li>
                  <li>
                    <Icon name="camera" /> {t.capPhoto}
                  </li>
                  <li>
                    <Icon name="phone" /> {t.capUssd} <strong>{USSD_CODE}</strong>
                  </li>
                </ul>
                <p className="section-label">{t.tryThese}</p>
                <div className="crop-cards">
                  {CROPS.map((key) => (
                    <div className={`crop-card crop-${key}`} key={key}>
                      <p className="crop-name">
                        <span className="crop-icon">
                          <Icon name="leaf" size={16} />
                        </span>
                        {t[`crop_${key}`]}
                      </p>
                      {starterQuestions[language][key].map((q) => (
                        <button type="button" key={q} onClick={() => send(q)}>
                          {q}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} uiLanguage={language} />
            ))}

            {loading && <ThinkingIndicator steps={steps} />}
            <div ref={endRef} />
          </div>
        </main>

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          {(photo || photoError || voiceStatus) && (
            <div className="composer-notes">
              {photo && (
                <div className="photo-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={t.photoOnly} />
                  <button type="button" className="link-button" onClick={clearPhoto}>
                    {t.removePhoto}
                  </button>
                </div>
              )}
              {photoError && <p className="photo-error">{photoError}</p>}
              {voiceStatus && (
                <p className="voice-status" role="status">
                  {voiceStatus}
                </p>
              )}
            </div>
          )}
          <div className="composer-bar">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="visually-hidden"
              id="photo"
              onChange={(e) => choosePhoto(e.target.files?.[0])}
            />
            <label htmlFor="photo" className="tool-button" title={t.addPhoto} aria-label={t.addPhoto}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                />
              </svg>
            </label>
            <MicButton
              language={language}
              disabled={loading}
              labels={{
                start: t.micStart,
                stop: t.micStop,
                listening: t.micListening,
                transcribing: t.micTranscribing,
              }}
              messages={{ check: t.micCheck, denied: t.micDenied, failed: t.micFailed }}
              onText={(text) => setInput((current) => (current ? `${current} ${text}` : text))}
              onStatus={setVoiceStatus}
            />
            <label htmlFor="question" className="visually-hidden">
              {t.placeholder}
            </label>
            <textarea
              id="question"
              value={input}
              rows={1}
              placeholder={t.placeholder}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button
              type="submit"
              className="send-button"
              disabled={loading || (!input.trim() && !photo)}
              aria-label={t.send}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M3 20.5 21 12 3 3.5v6.6l12 1.9-12 1.9z" />
              </svg>
              <span>{t.send}</span>
            </button>
          </div>
        </form>
        <footer className="app-footer">
          © {new Date().getFullYear()} · {t.developedBy} <strong>SAN TECH</strong>
        </footer>
      </div>
    </div>
  );
}
