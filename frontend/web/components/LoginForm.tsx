"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import LanguageToggle from "./LanguageToggle";
import type { Language } from "@/lib/types";

const TEXT = {
  rw: {
    title: "Injira",
    subtitle: "Ku bajyanama b'ubuhinzi na MINAGRI / RAB",
    user: "Izina ukoresha",
    password: "Ijambo ry'ibanga",
    submit: "Injira",
    busy: "Biri gukorwa…",
    farmer: "Uri umuhinzi? Ntukeneye kwinjira.",
    toChat: "Jya ku kiganiro",
    error: "Ntibyakunze. Ongera ugerageze.",
  },
  en: {
    title: "Log in",
    subtitle: "For extension officers and MINAGRI / RAB",
    user: "Username",
    password: "Password",
    submit: "Log in",
    busy: "Checking…",
    farmer: "Are you a farmer? You do not need to log in.",
    toChat: "Go to the chat",
    error: "That did not work. Please try again.",
  },
};

export default function LoginForm({ next }: { next?: string }) {
  const [language, setLanguage] = useState<Language>("rw");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = TEXT[language];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || t.error);
      // Only follow a "next" page inside this site.
      const target = next && next.startsWith("/") && !next.startsWith("//") ? next : body.home;
      window.location.assign(target);
    } catch (err) {
      setError((err as Error).message || t.error);
      setBusy(false);
    }
  }

  return (
    <div className="insights login-page">
      <main className="login-card">
        <div className="login-top">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="leaf" size={22} />
          </span>
          <LanguageToggle value={language} onChange={setLanguage} />
        </div>
        <h1>{t.title}</h1>
        <p className="panel-hint">{t.subtitle}</p>
        <form className="dash-form" onSubmit={submit}>
          <label>
            {t.user}
            <input autoComplete="username" required maxLength={80} value={user} onChange={(e) => setUser(e.target.value)} />
          </label>
          <label>
            {t.password}
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="form-footer">
            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? t.busy : t.submit}
            </button>
            {error && <span className="form-error">{error}</span>}
          </div>
        </form>
        <p className="login-farmer">
          {t.farmer} <Link href="/chat">{t.toChat}</Link>
        </p>
      </main>
    </div>
  );
}
