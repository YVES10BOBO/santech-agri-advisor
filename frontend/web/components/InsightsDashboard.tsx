"use client";

import { useCallback, useEffect, useState } from "react";
import { BarList, DashboardHead, DashboardNav, labelFor, Tile, type Row } from "./DashboardParts";
import LanguageToggle from "./LanguageToggle";
import type { Language } from "@/lib/types";

interface Question {
  question: string;
  language: string | null;
  crop: string | null;
  dimension: string | null;
  channel?: string;
  asked_at: string;
}

export interface Escalation {
  id: number;
  officer: string;
  district: string | null;
  sector: string | null;
  crop: string | null;
  dimension: string | null;
  issue: string;
  farmers_affected: number | null;
  severity: "low" | "medium" | "high";
  status: "open" | "reviewing" | "resolved";
  response: string | null;
  created_at: string;
  updated_at: string;
}

interface Insights {
  days: number;
  totals: {
    questions: number;
    last_24h: number;
    answered: number;
    kinyarwanda: number;
    photos: number;
    sms_ussd: number;
    without_sources: number;
    avg_latency_ms: number | null;
  };
  per_day: { day: string; questions: number }[];
  by_crop: Row[];
  by_topic: Row[];
  by_language: Row[];
  by_channel: Row[];
  photo_problems: Row[];
  knowledge_gaps: Question[];
  recent: Question[];
  // null until database/migrations/004_extension_tables.sql has been run
  field: { records: number; by_topic: Row[]; by_district: Row[] } | null;
  escalations: Escalation[] | null;
}

const TEXT = {
  rw: {
    title: "Ibyo abahinzi babaza",
    subtitle: "Ishusho rusange ya MINAGRI na RAB · amakuru nyayo, nta mazina y'abahinzi",
    period: "Igihe",
    days: "iminsi",
    questions: "Ibibazo byose",
    last24h: "Mu masaha 24",
    kinyarwanda: "Mu Kinyarwanda",
    answered: "Byasubijwe",
    photos: "Amafoto",
    smsUssd: "SMS / USSD",
    avgTime: "Igihe cyo gusubiza",
    noSources: "Nta nyandiko",
    perDay: "Ibibazo ku munsi",
    byCrop: "Ku gihingwa",
    byTopic: "Ku ngingo",
    byLanguage: "Ku rurimi",
    byChannel: "Ku buryo",
    photoProblems: "Ibyo amafoto yerekanye",
    photoEmpty: "Nta foto irasuzumwa muri iki gihe.",
    gaps: "Ibyuho mu bumenyi",
    gapsHint: "Ibibazo byasubijwe nta nyandiko yabonetse: ni byo bikeneye inyandiko nshya.",
    recent: "Ibibazo biheruka",
    question: "Ikibazo",
    crop: "Igihingwa",
    topic: "Ingingo",
    when: "Igihe",
    loading: "Turimo gutegura imibare…",
    error: "Imibare ntiyabonetse. Reba ko seriveri ikora.",
    none: "Nta makuru",
    field: "Ibyo abajyanama babonye mu murima",
    fieldHint: "Ibyanditswe n'abajyanama b'ubuhinzi mu gihe cyatoranyijwe.",
    fieldRecords: "inyandiko z'umurima",
    byDistrict: "Ku karere",
    escalations: "Ibibazo byazamuwe n'abajyanama",
    escalationsHint: "Ibibazo bigaruka kenshi abajyanama basaba MINAGRI/RAB gukurikirana.",
    migrationNeeded: "Banza ukoreshe database/migrations/004_extension_tables.sql muri Supabase.",
    issue: "Ikibazo",
    where: "Aho",
    affected: "Abahinzi",
    severity: "Uburemere",
    status: "Uko gihagaze",
    action: "Igikorwa",
    markReviewing: "Turimo kugisuzuma",
    markResolved: "Cyakemutse",
    reopen: "Ongera ugifungure",
    replyPlaceholder: "Igisubizo ku mujyanama (si ngombwa)",
  },
  en: {
    title: "What farmers are asking",
    subtitle: "Overview for MINAGRI and RAB · live data, no farmer names",
    period: "Period",
    days: "days",
    questions: "Questions",
    last24h: "Last 24 hours",
    kinyarwanda: "In Kinyarwanda",
    answered: "Answered",
    photos: "Photos",
    smsUssd: "SMS / USSD",
    avgTime: "Average answer time",
    noSources: "Without documents",
    perDay: "Questions per day",
    byCrop: "By crop",
    byTopic: "By topic",
    byLanguage: "By language",
    byChannel: "By channel",
    photoProblems: "Found in photos",
    photoEmpty: "No photos diagnosed in this period.",
    gaps: "Knowledge gaps",
    gapsHint: "Questions answered without a matching document: these need new guidance.",
    recent: "Latest questions",
    question: "Question",
    crop: "Crop",
    topic: "Topic",
    when: "When",
    loading: "Preparing the figures…",
    error: "No data received. Check that the backend is running.",
    none: "No data",
    field: "What extension officers found in the field",
    fieldHint: "Visits recorded by extension officers in the selected period.",
    fieldRecords: "field records",
    byDistrict: "Field visits by district",
    escalations: "Issues escalated by extension officers",
    escalationsHint: "Recurring problems officers ask MINAGRI/RAB to follow up.",
    migrationNeeded: "Run database/migrations/004_extension_tables.sql in Supabase first.",
    issue: "Issue",
    where: "Where",
    affected: "Farmers",
    severity: "Severity",
    status: "Status",
    action: "Action",
    markReviewing: "Mark reviewing",
    markResolved: "Mark resolved",
    reopen: "Reopen",
    replyPlaceholder: "Reply to the officer (optional)",
  },
};

type Text = (typeof TEXT)["rw"];

const pct = (part: number, whole: number) => (whole ? Math.round((100 * part) / whole) : 0);

// Questions per day: vertical bars with a hover tooltip and a few date labels.
function DayChart({ data, locale }: { data: Insights["per_day"]; locale: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.questions));
  const ticks = [0, Math.round(max / 2), max];
  const fmt = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" });
  const every = Math.max(1, Math.ceil(data.length / 6));
  return (
    <div className="daychart">
      <div className="daychart-axis" aria-hidden="true">
        {[...ticks].reverse().map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="daychart-plot">
        <div className="daychart-grid" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ bottom: `${(100 * t) / max}%` }} />
          ))}
        </div>
        <div className="daychart-bars" onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <div
              key={d.day}
              className={`daychart-col${hover === i ? " is-hover" : ""}`}
              onMouseEnter={() => setHover(i)}
              aria-label={`${fmt(d.day)}: ${d.questions}`}
            >
              <span className="daychart-bar" style={{ height: `${(100 * d.questions) / max}%` }} />
              {hover === i && (
                <span className="daychart-tip">
                  <strong>{d.questions}</strong> · {fmt(d.day)}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="daychart-x" aria-hidden="true">
          {data.map((d, i) => (
            <span key={d.day}>{i % every === 0 || i === data.length - 1 ? fmt(d.day) : ""}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InsightsDashboard() {
  const [language, setLanguage] = useState<Language>("rw");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Insights | null>(null);
  const [failed, setFailed] = useState(false);
  const t = TEXT[language];
  const label = labelFor(language);
  const locale = language === "rw" ? "rw-RW" : "en-GB";

  const load = useCallback(() => {
    setFailed(false);
    fetch(`/api/insights?days=${days}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setFailed(true));
  }, [days]);

  useEffect(load, [load]);

  const s = data?.totals;
  return (
    <div className="insights">
      <DashboardNav current="/insights" language={language} />
      <DashboardHead icon="chart" title={t.title} subtitle={t.subtitle}>
        <label className="period">
          {t.period}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 30, 90].map((d) => (
              <option key={d} value={d}>
                {d} {t.days}
              </option>
            ))}
          </select>
        </label>
        <LanguageToggle value={language} onChange={setLanguage} />
      </DashboardHead>

      {failed && <p className="insights-status is-error">{t.error}</p>}
      {!data && !failed && <p className="insights-status">{t.loading}</p>}

      {data && s && (
        <main className="insights-grid">
          <section className="kpis" aria-label={t.questions}>
            <Tile label={t.questions} value={String(s.questions)} note={`${data.days} ${t.days}`} />
            <Tile label={t.last24h} value={String(s.last_24h)} />
            <Tile label={t.kinyarwanda} value={`${pct(s.kinyarwanda, s.questions)}%`} />
            <Tile label={t.answered} value={`${pct(s.answered, s.questions)}%`} />
            <Tile label={t.photos} value={String(s.photos)} />
            <Tile label={t.smsUssd} value={String(s.sms_ussd)} />
            <Tile label={t.avgTime} value={s.avg_latency_ms ? `${(s.avg_latency_ms / 1000).toFixed(1)} s` : "–"} />
            <Tile label={t.noSources} value={`${pct(s.without_sources, s.questions)}%`} />
          </section>

          <section className="panel panel-wide">
            <h2>{t.perDay}</h2>
            <DayChart data={data.per_day} locale={locale} />
          </section>

          <section className="panel">
            <h2>{t.byCrop}</h2>
            <BarList rows={data.by_crop} label={label} none={t.none} />
          </section>
          <section className="panel">
            <h2>{t.byTopic}</h2>
            <BarList rows={data.by_topic} label={label} none={t.none} />
          </section>
          <section className="panel">
            <h2>{t.byLanguage}</h2>
            <BarList rows={data.by_language} label={label} none={t.none} />
          </section>
          <section className="panel">
            <h2>{t.byChannel}</h2>
            <BarList rows={data.by_channel} label={label} none={t.none} />
          </section>
          <section className="panel panel-wide">
            <h2>{t.photoProblems}</h2>
            <BarList rows={data.photo_problems} label={(k) => k} none={t.photoEmpty} />
          </section>

          <section className="panel panel-wide">
            <h2>{t.gaps}</h2>
            <p className="panel-hint">{t.gapsHint}</p>
            <QuestionTable rows={data.knowledge_gaps} t={t} label={label} none={t.none} />
          </section>

          <section className="panel panel-wide">
            <h2>{t.escalations}</h2>
            <p className="panel-hint">{t.escalationsHint}</p>
            {data.escalations === null ? (
              <p className="empty">{t.migrationNeeded}</p>
            ) : (
              <EscalationTable rows={data.escalations} t={t} label={label} onChanged={load} />
            )}
          </section>
          <section className="panel">
            <h2>{t.field}</h2>
            <p className="panel-hint">{t.fieldHint}</p>
            {data.field === null ? (
              <p className="empty">{t.migrationNeeded}</p>
            ) : (
              <>
                <p className="kpi-inline">
                  <strong>{data.field.records}</strong> {t.fieldRecords}
                </p>
                <BarList rows={data.field.by_topic} label={label} none={t.none} />
              </>
            )}
          </section>
          <section className="panel">
            <h2>{t.byDistrict}</h2>
            <p className="panel-hint">{t.fieldHint}</p>
            {data.field === null ? (
              <p className="empty">{t.migrationNeeded}</p>
            ) : (
              <BarList rows={data.field.by_district} label={label} none={t.none} />
            )}
          </section>

          <section className="panel panel-wide">
            <h2>{t.recent}</h2>
            <QuestionTable rows={data.recent} t={t} label={label} none={t.none} />
          </section>
        </main>
      )}
    </div>
  );
}

function QuestionTable({
  rows, t, label, none,
}: {
  rows: Question[];
  t: Text;
  label: (k: string) => string;
  none: string;
}) {
  if (rows.length === 0) return <p className="empty">{none}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t.question}</th>
            <th>{t.crop}</th>
            <th>{t.topic}</th>
            <th>{t.when}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.asked_at}-${i}`}>
              <td className="q-cell">{r.question}</td>
              <td>{r.crop ? label(r.crop) : "–"}</td>
              <td>{r.dimension ? label(r.dimension) : "–"}</td>
              <td className="nowrap">{r.asked_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Escalations from extension officers; MINAGRI/RAB can reply and change the status.
function EscalationTable({
  rows, t, label, onChanged,
}: {
  rows: Escalation[];
  t: Text;
  label: (k: string) => string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [replies, setReplies] = useState<Record<number, string>>({});

  async function setStatus(id: number, status: Escalation["status"]) {
    setBusy(id);
    try {
      await fetch(`/api/extension/escalations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, response: replies[id]?.trim() || null }),
      });
      setReplies((m) => ({ ...m, [id]: "" }));
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) return <p className="empty">{t.none}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t.issue}</th>
            <th>{t.where}</th>
            <th>{t.affected}</th>
            <th>{t.severity}</th>
            <th>{t.status}</th>
            <th>{t.action}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="q-cell">
                {r.issue}
                <span className="cell-sub">
                  {[r.crop && label(r.crop), r.dimension && label(r.dimension), r.officer, r.created_at]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {r.response && <span className="cell-reply">{r.response}</span>}
              </td>
              <td>{[r.district, r.sector].filter(Boolean).join(", ") || "–"}</td>
              <td>{r.farmers_affected ?? "–"}</td>
              <td>
                <span className={`chip sev-${r.severity}`}>{label(r.severity)}</span>
              </td>
              <td>
                <span className={`chip st-${r.status}`}>{label(r.status)}</span>
              </td>
              <td className="actions-cell">
                {r.status !== "resolved" && (
                  <input
                    className="reply-input"
                    placeholder={t.replyPlaceholder}
                    aria-label={t.replyPlaceholder}
                    value={replies[r.id] ?? ""}
                    maxLength={1500}
                    onChange={(e) => setReplies((m) => ({ ...m, [r.id]: e.target.value }))}
                  />
                )}
                <div className="row-actions">
                  {r.status === "open" && (
                    <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, "reviewing")}>
                      {t.markReviewing}
                    </button>
                  )}
                  {r.status !== "resolved" ? (
                    <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, "resolved")}>
                      {t.markResolved}
                    </button>
                  ) : (
                    <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, "open")}>
                      {t.reopen}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
