"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import LanguageToggle from "./LanguageToggle";
import type { Language } from "@/lib/types";

interface Row {
  key: string;
  questions: number;
}
interface Question {
  question: string;
  language: string | null;
  crop: string | null;
  dimension: string | null;
  channel?: string;
  asked_at: string;
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
}

const TEXT = {
  rw: {
    title: "Ibyo abahinzi babaza",
    subtitle: "Ishusho rusange ya MINAGRI na RAB · amakuru nyayo, nta mazina y'abahinzi",
    back: "Subira ku kiganiro",
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
  },
  en: {
    title: "What farmers are asking",
    subtitle: "Overview for MINAGRI and RAB · live data, no farmer names",
    back: "Back to chat",
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
  },
};

const LABELS: Record<Language, Record<string, string>> = {
  rw: {
    maize: "Ibigori", beans: "Ibishyimbo", potato: "Ibirayi", general: "Rusange",
    pest_disease: "Indwara n'ibyonnyi", fertilizer_inputs: "Ifumbire", seeds_planting: "Imbuto no gutera",
    weeds: "Ibyatsi bibi", soil_water_fertility: "Ubutaka n'amazi", post_harvest: "Nyuma yo gusarura",
    weather: "Ikirere", government_programs: "Gahunda za Leta", off_topic: "Bitari iby'ubuhinzi",
    not_detected: "Ntibyamenyekanye", rw: "Ikinyarwanda", en: "Icyongereza",
    web_api: "Urubuga / API", sms_ussd: "SMS / USSD", photo: "Ifoto",
  },
  en: {
    maize: "Maize", beans: "Beans", potato: "Irish potato", general: "General",
    pest_disease: "Pests & diseases", fertilizer_inputs: "Fertilizer & inputs", seeds_planting: "Seeds & planting",
    weeds: "Weeds", soil_water_fertility: "Soil, water & fertility", post_harvest: "Post-harvest",
    weather: "Weather", government_programs: "Government programs", off_topic: "Not farming",
    not_detected: "Not detected", rw: "Kinyarwanda", en: "English",
    web_api: "Web / API", sms_ussd: "SMS / USSD", photo: "Photo",
  },
};

const pct = (part: number, whole: number) => (whole ? Math.round((100 * part) / whole) : 0);

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {note && <p className="kpi-note">{note}</p>}
    </div>
  );
}

// Ranked horizontal bars: one hue, value printed at the end of each bar.
function BarList({ rows, label, none }: { rows: Row[]; label: (k: string) => string; none: string }) {
  if (rows.length === 0) return <p className="empty">{none}</p>;
  const max = Math.max(...rows.map((r) => r.questions));
  return (
    <ul className="barlist">
      {rows.map((r) => (
        <li key={r.key} title={`${label(r.key)}: ${r.questions}`}>
          <span className="barlist-label">{label(r.key)}</span>
          <span className="barlist-track">
            <span className="barlist-bar" style={{ width: `${(100 * r.questions) / max}%` }} />
          </span>
          <span className="barlist-value">{r.questions}</span>
        </li>
      ))}
    </ul>
  );
}

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
  const label = (k: string) => LABELS[language][k] ?? k;
  const locale = language === "rw" ? "rw-RW" : "en-GB";

  useEffect(() => {
    setFailed(false);
    fetch(`/api/insights?days=${days}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setFailed(true));
  }, [days]);

  const s = data?.totals;
  return (
    <div className="insights">
      <header className="insights-head">
        <div className="insights-title">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="leaf" size={22} />
          </span>
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <div className="insights-actions">
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
          <Link href="/chat" className="back-link">
            {t.back}
          </Link>
        </div>
      </header>

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
  t: (typeof TEXT)["rw"];
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
