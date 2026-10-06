"use client";

import Link from "next/link";
import type { Conversation } from "@/lib/history";
import { USSD_CODE, type Strings } from "@/lib/strings";
import type { Language } from "@/lib/types";

interface Props {
  t: Strings;
  language: Language;
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function formatDate(ms: number, language: Language): string {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString(language === "rw" ? "rw-RW" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(language === "rw" ? "rw-RW" : "en-GB", { day: "numeric", month: "short" });
}

export default function Sidebar({
  t, language, open, conversations, activeId, onNew, onOpen, onDelete, onClose,
}: Props) {
  return (
    <>
      <div className={`sidebar-backdrop${open ? " is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar${open ? " is-open" : ""}`} aria-label={t.history}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M17 8C8 10 5.9 16.2 3.8 21.3l1.9.7 1-2.3c.5.2 1 .3 1.3.3C19 20 22 3 22 3c-1 2-8 2.3-13 3.3S2 11.5 2 13.5s1.8 3.8 1.8 3.8C7 8 17 8 17 8Z"
              />
            </svg>
          </span>
          <div>
            <p className="brand-name">{t.brand}</p>
            <p className="brand-sub">{t.brandSub}</p>
          </div>
          <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label={t.closeMenu}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" />
            </svg>
          </button>
        </div>

        <button type="button" className="new-chat" onClick={onNew}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
          </svg>
          {t.newChat}
        </button>

        <nav className="history" aria-label={t.history}>
          <p className="section-label">{t.history}</p>
          {conversations.length === 0 ? (
            <p className="history-empty">{t.historyEmpty}</p>
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c.id} className={c.id === activeId ? "is-active" : ""}>
                  <button type="button" className="history-item" onClick={() => onOpen(c.id)}>
                    <span className="history-title">{c.title}</span>
                    <span className="history-date">{formatDate(c.updatedAt, language)}</span>
                  </button>
                  <button
                    type="button"
                    className="icon-button history-delete"
                    onClick={() => onDelete(c.id)}
                    aria-label={`${t.deleteChat}: ${c.title}`}
                    title={t.deleteChat}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link href="/insights" className="sidebar-link">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M4 19h16v2H2V3h2v16Zm3-2V10h3v7H7Zm5 0V6h3v11h-3Zm5 0v-4h3v4h-3Z" />
            </svg>
            {t.insightsLink}
          </Link>
          <div className="channel-card">
            <p className="channel-title">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 3v13h10V5H7Zm5 14.5a1 1 0 1 0 0 .01Z" />
              </svg>
              {t.channelsTitle}
            </p>
            <p>
              {t.channelsUssd.split("{code}")[0]}
              <strong className="ussd-code">{USSD_CODE}</strong>
              {t.channelsUssd.split("{code}")[1]}
            </p>
            <p>{t.channelsSms}</p>
          </div>
          <p className="footer-note">{t.footerNote}</p>
        </div>
      </aside>
    </>
  );
}
