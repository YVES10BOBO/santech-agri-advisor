"use client";

// Extension officers, field agents and farmer promoters (C4IR "secondary users"):
// digital record-keeping, a second opinion from a photo, a knowledge refresher,
// and a way to escalate recurring issues to MINAGRI/RAB.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BarList, DashboardHead, DashboardNav, labelFor, Tile, TOPICS, type Row } from "./DashboardParts";
import Icon from "./Icon";
import LanguageToggle from "./LanguageToggle";
import type { Escalation } from "./InsightsDashboard";
import { RWANDA_DISTRICTS } from "@/lib/profile";
import type { Language } from "@/lib/types";

interface FieldRecord {
  id: number;
  officer: string;
  farmer_ref: string | null;
  district: string | null;
  sector: string | null;
  crop: string | null;
  dimension: string | null;
  problem: string;
  advice: string | null;
  follow_up_date: string | null;
  created_at: string;
}
interface Summary {
  records: number;
  records_30d: number;
  follow_ups_7d: number;
  open_escalations: number;
  top_problems: Row[];
  by_crop: Row[];
}
interface KnowledgeDoc {
  title: string;
  source: string | null;
  url: string | null;
  crop: string;
  language: string;
  chunks: number;
}

type Tab = "records" | "escalate" | "refresher";
const OFFICER_KEY = "santech-officer";
const CROPS = ["maize", "beans", "potato", "other"] as const;

const TEXT = {
  rw: {
    title: "Abajyanama b'ubuhinzi",
    subtitle: "Kwandika ibyo wabonye mu murima, kuzamura ibibazo, no kwibutsa ubumenyi",
    officer: "Izina ryawe",
    officerHint: "Andika izina ryawe kugira ngo ubone inyandiko zawe.",
    records: "Inyandiko zanjye",
    records30: "Mu minsi 30",
    followUps: "Gusubirayo iki cyumweru",
    openEsc: "Ibibazo bitarakemuka",
    tabRecords: "Inyandiko z'umurima",
    tabEscalate: "Kuzamura ikibazo",
    tabRefresher: "Kwibutsa ubumenyi",
    newRecord: "Andika uruzinduko",
    farmerRef: "Kode cyangwa izina ry'umuhinzi",
    farmerRefHint: "Nta nimero ya telefoni cyangwa indangamuntu",
    district: "Akarere",
    sector: "Umurenge",
    crop: "Igihingwa",
    topic: "Ingingo",
    problem: "Ikibazo wabonye",
    advice: "Inama watanze",
    followUp: "Itariki yo gusubirayo",
    save: "Bika",
    saving: "Biri kubikwa…",
    saved: "Byabitswe.",
    choose: "Hitamo",
    secondOpinion: "Saba igitekerezo cya kabiri ku ifoto",
    secondOpinionHint: "Fata ifoto y'igihingwa kirwaye mu kiganiro: AI ivuga indwara ishoboka n'icyo gukora.",
    myRecords: "Inyandiko ziheruka",
    farmer: "Umuhinzi",
    when: "Igihe",
    topProblems: "Ibibazo bikunze kugaragara",
    byCrop: "Ku gihingwa",
    newEscalation: "Zamura ikibazo kigaruka kenshi",
    escalationHint: "Kigera kuri MINAGRI na RAB ku ishusho yabo, bakagusubiza hano.",
    issue: "Ikibazo",
    affected: "Abahinzi bagezweho",
    severity: "Uburemere",
    send: "Ohereza",
    myEscalations: "Ibibazo nazamuye",
    status: "Uko gihagaze",
    reply: "Igisubizo cya RAB",
    askAi: "Baza umujyanama w'ubwenge",
    askAiHint: "Ibibazo ku bigori, ibishyimbo n'ibirayi, mu Kinyarwanda cyangwa Icyongereza, ukoresheje inyandiko cyangwa ijwi.",
    docs: "Inyandiko z'ubumenyi",
    docsHint: "Inyandiko za RAB, MINAGRI n'abandi umujyanama w'ubwenge ashingiraho.",
    open: "Fungura",
    none: "Nta makuru",
    error: "Ntibyakunze. Reba ko seriveri ikora.",
    needName: "Banza wandike izina ryawe hejuru.",
    privacy: "Ntitubika nimero za telefoni z'abahinzi (itegeko No 058/2021 ryo kurinda amakuru bwite).",
  },
  en: {
    title: "Extension officers",
    subtitle: "Record field visits, escalate recurring issues, refresh your knowledge",
    officer: "Your name",
    officerHint: "Enter your name to see your own records.",
    records: "My records",
    records30: "Last 30 days",
    followUps: "Follow-ups this week",
    openEsc: "Open escalations",
    tabRecords: "Field records",
    tabEscalate: "Escalate an issue",
    tabRefresher: "Knowledge refresher",
    newRecord: "Record a visit",
    farmerRef: "Farmer code or first name",
    farmerRefHint: "No phone or ID numbers",
    district: "District",
    sector: "Sector",
    crop: "Crop",
    topic: "Topic",
    problem: "Problem seen",
    advice: "Advice given",
    followUp: "Follow-up date",
    save: "Save",
    saving: "Saving…",
    saved: "Saved.",
    choose: "Choose",
    secondOpinion: "Get a second opinion from a photo",
    secondOpinionHint: "Take a photo of the sick plant in the chat: the AI names the likely problem and what to do.",
    myRecords: "Latest records",
    farmer: "Farmer",
    when: "When",
    topProblems: "Most common problems",
    byCrop: "By crop",
    newEscalation: "Escalate a recurring issue",
    escalationHint: "It reaches MINAGRI and RAB on their dashboard, and their reply shows here.",
    issue: "Issue",
    affected: "Farmers affected",
    severity: "Severity",
    send: "Send",
    myEscalations: "My escalations",
    status: "Status",
    reply: "RAB reply",
    askAi: "Ask the AI advisor",
    askAiHint: "Questions on maize, beans and Irish potato, in Kinyarwanda or English, by text or voice.",
    docs: "Knowledge documents",
    docsHint: "RAB, MINAGRI and partner guidance the AI advisor answers from.",
    open: "Open",
    none: "No data",
    error: "That did not work. Check that the backend is running.",
    needName: "Enter your name at the top first.",
    privacy: "Farmers' phone numbers are not stored (Law No 058/2021 on personal data protection).",
  },
};

type Text = (typeof TEXT)["rw"];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/extension/${path}`, { cache: "no-store", ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.detail === "string" ? body.detail : `HTTP ${res.status}`);
  return body as T;
}

const post = <T,>(path: string, data: unknown) =>
  api<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export default function ExtensionDashboard() {
  const [language, setLanguage] = useState<Language>("rw");
  const [officer, setOfficer] = useState("");
  const [tab, setTab] = useState<Tab>("records");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [docs, setDocs] = useState<KnowledgeDoc[] | null>(null);
  const [error, setError] = useState("");
  const t = TEXT[language];
  const label = labelFor(language);

  useEffect(() => {
    try {
      setOfficer(localStorage.getItem(OFFICER_KEY) ?? "");
    } catch {}
  }, []);

  const name = officer.trim();
  const load = useCallback(() => {
    if (!name) return;
    const q = `officer=${encodeURIComponent(name)}`;
    setError("");
    Promise.all([
      api<Summary>(`summary?${q}`),
      api<FieldRecord[]>(`records?${q}&limit=20`),
      api<Escalation[]>(`escalations?${q}&limit=20`),
    ])
      .then(([s, r, e]) => {
        setSummary(s);
        setRecords(r);
        setEscalations(e);
      })
      .catch((e: Error) => setError(e.message));
  }, [name]);

  useEffect(() => {
    const id = setTimeout(load, 400); // wait until the officer stops typing
    return () => clearTimeout(id);
  }, [load]);

  useEffect(() => {
    if (tab === "refresher" && docs === null) {
      api<KnowledgeDoc[]>("knowledge").then(setDocs).catch((e: Error) => setError(e.message));
    }
  }, [tab, docs]);

  function changeOfficer(v: string) {
    setOfficer(v);
    try {
      localStorage.setItem(OFFICER_KEY, v);
    } catch {}
  }

  return (
    <div className="insights">
      <DashboardNav current="/extension" language={language} />
      <DashboardHead icon="badge" title={t.title} subtitle={t.subtitle}>
        <label className="period">
          {t.officer}
          <input
            className="officer-input"
            value={officer}
            maxLength={60}
            placeholder={t.officer}
            onChange={(e) => changeOfficer(e.target.value)}
          />
        </label>
        <LanguageToggle value={language} onChange={setLanguage} />
      </DashboardHead>

      {!name && <p className="insights-status">{t.officerHint}</p>}
      {error && <p className="insights-status is-error">{error}</p>}

      <main className="insights-grid">
        <section className="kpis kpis-4" aria-label={t.records}>
          <Tile label={t.records} value={summary ? String(summary.records) : "–"} />
          <Tile label={t.records30} value={summary ? String(summary.records_30d) : "–"} />
          <Tile label={t.followUps} value={summary ? String(summary.follow_ups_7d) : "–"} />
          <Tile label={t.openEsc} value={summary ? String(summary.open_escalations) : "–"} />
        </section>

        <div className="tabs panel-wide" role="tablist">
          {(["records", "escalate", "refresher"] as Tab[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={tab === k ? "is-active" : ""}
              onClick={() => setTab(k)}
            >
              <Icon name={k === "records" ? "note" : k === "escalate" ? "flag" : "book"} size={16} />
              {k === "records" ? t.tabRecords : k === "escalate" ? t.tabEscalate : t.tabRefresher}
            </button>
          ))}
        </div>

        {tab === "records" && (
          <>
            <section className="panel">
              <h2>{t.newRecord}</h2>
              <RecordForm t={t} label={label} officer={name} onSaved={load} />
              <Link href="/chat" className="tool-card">
                <Icon name="camera" size={20} />
                <span>
                  <strong>{t.secondOpinion}</strong>
                  <small>{t.secondOpinionHint}</small>
                </span>
              </Link>
            </section>
            <section className="panel">
              <h2>{t.topProblems}</h2>
              <BarList rows={summary?.top_problems ?? []} label={label} none={t.none} />
              <h2 className="h2-gap">{t.byCrop}</h2>
              <BarList rows={summary?.by_crop ?? []} label={label} none={t.none} />
            </section>
            <section className="panel panel-wide">
              <h2>{t.myRecords}</h2>
              <RecordTable rows={records} t={t} label={label} />
            </section>
          </>
        )}

        {tab === "escalate" && (
          <>
            <section className="panel">
              <h2>{t.newEscalation}</h2>
              <p className="panel-hint">{t.escalationHint}</p>
              <EscalationForm t={t} label={label} officer={name} onSaved={load} />
            </section>
            <section className="panel">
              <h2>{t.myEscalations}</h2>
              {escalations.length === 0 ? (
                <p className="empty">{t.none}</p>
              ) : (
                <ul className="esc-list">
                  {escalations.map((e) => (
                    <li key={e.id}>
                      <div className="esc-top">
                        <span className={`chip st-${e.status}`}>{label(e.status)}</span>
                        <span className={`chip sev-${e.severity}`}>{label(e.severity)}</span>
                        <span className="cell-sub">{e.created_at}</span>
                      </div>
                      <p>{e.issue}</p>
                      <span className="cell-sub">
                        {[e.crop && label(e.crop), e.dimension && label(e.dimension), e.district]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {e.response && (
                        <p className="cell-reply">
                          <strong>{t.reply}:</strong> {e.response}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {tab === "refresher" && (
          <>
            <section className="panel">
              <h2>{t.askAi}</h2>
              <Link href="/chat" className="tool-card">
                <Icon name="chat" size={20} />
                <span>
                  <strong>{t.askAi}</strong>
                  <small>{t.askAiHint}</small>
                </span>
              </Link>
              <Link href="/chat" className="tool-card">
                <Icon name="camera" size={20} />
                <span>
                  <strong>{t.secondOpinion}</strong>
                  <small>{t.secondOpinionHint}</small>
                </span>
              </Link>
            </section>
            <section className="panel">
              <h2>{t.docs}</h2>
              <p className="panel-hint">{t.docsHint}</p>
              {docs === null ? (
                <p className="empty">…</p>
              ) : docs.length === 0 ? (
                <p className="empty">{t.none}</p>
              ) : (
                <ul className="doc-list">
                  {docs.map((d) => (
                    <li key={`${d.title}-${d.crop}`}>
                      <span className="chip">{label(d.crop)}</span>
                      <span className="doc-title">
                        {d.url ? (
                          <a href={d.url} target="_blank" rel="noreferrer">
                            {d.title}
                          </a>
                        ) : (
                          d.title
                        )}
                        <small>{d.source ?? ""}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <p className="privacy-note panel-wide">{t.privacy}</p>
      </main>
    </div>
  );
}

function useSubmit(officer: string, t: Text, onSaved: () => void) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  async function run(fn: () => Promise<unknown>, reset: () => void) {
    if (!officer) {
      setError(t.needName);
      return;
    }
    setState("saving");
    setError("");
    try {
      await fn();
      reset();
      setState("saved");
      onSaved();
    } catch (e) {
      setError((e as Error).message || t.error);
      setState("idle");
    }
  }
  return { state, error, run };
}

function CommonFields({
  t, label, v, set,
}: {
  t: Text;
  label: (k: string) => string;
  v: Record<string, string>;
  set: (k: string, val: string) => void;
}) {
  return (
    <div className="form-row">
      <label>
        {t.district}
        <select value={v.district} onChange={(e) => set("district", e.target.value)}>
          <option value="">{t.choose}</option>
          {RWANDA_DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label>
        {t.sector}
        <input value={v.sector} maxLength={40} onChange={(e) => set("sector", e.target.value)} />
      </label>
      <label>
        {t.crop}
        <select value={v.crop} onChange={(e) => set("crop", e.target.value)}>
          <option value="">{t.choose}</option>
          {CROPS.map((c) => (
            <option key={c} value={c}>
              {label(c)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.topic}
        <select value={v.dimension} onChange={(e) => set("dimension", e.target.value)}>
          <option value="">{t.choose}</option>
          {TOPICS.map((d) => (
            <option key={d} value={d}>
              {label(d)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const orNull = (s: string) => (s.trim() ? s.trim() : null);

function RecordForm({
  t, label, officer, onSaved,
}: {
  t: Text;
  label: (k: string) => string;
  officer: string;
  onSaved: () => void;
}) {
  const blank = { farmer_ref: "", district: "", sector: "", crop: "", dimension: "", problem: "", advice: "", follow_up_date: "" };
  const [v, setV] = useState(blank);
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));
  const { state, error, run } = useSubmit(officer, t, onSaved);

  return (
    <form
      className="dash-form"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            post("records", {
              officer,
              farmer_ref: orNull(v.farmer_ref),
              district: orNull(v.district),
              sector: orNull(v.sector),
              crop: orNull(v.crop),
              dimension: orNull(v.dimension),
              problem: v.problem.trim(),
              advice: orNull(v.advice),
              follow_up_date: orNull(v.follow_up_date),
            }),
          () => setV({ ...blank, district: v.district, sector: v.sector }),
        );
      }}
    >
      <label>
        {t.farmerRef}
        <input
          value={v.farmer_ref}
          maxLength={40}
          placeholder={t.farmerRefHint}
          onChange={(e) => set("farmer_ref", e.target.value)}
        />
      </label>
      <CommonFields t={t} label={label} v={v} set={set} />
      <label>
        {t.problem}
        <textarea required minLength={3} maxLength={1000} rows={2} value={v.problem} onChange={(e) => set("problem", e.target.value)} />
      </label>
      <label>
        {t.advice}
        <textarea maxLength={2000} rows={2} value={v.advice} onChange={(e) => set("advice", e.target.value)} />
      </label>
      <label>
        {t.followUp}
        <input type="date" value={v.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} />
      </label>
      <FormFooter t={t} state={state} error={error} label={t.save} />
    </form>
  );
}

function EscalationForm({
  t, label, officer, onSaved,
}: {
  t: Text;
  label: (k: string) => string;
  officer: string;
  onSaved: () => void;
}) {
  const blank = { district: "", sector: "", crop: "", dimension: "", issue: "", farmers_affected: "", severity: "medium" };
  const [v, setV] = useState(blank);
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));
  const { state, error, run } = useSubmit(officer, t, onSaved);

  return (
    <form
      className="dash-form"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            post("escalations", {
              officer,
              district: orNull(v.district),
              sector: orNull(v.sector),
              crop: orNull(v.crop),
              dimension: orNull(v.dimension),
              issue: v.issue.trim(),
              farmers_affected: v.farmers_affected ? Number(v.farmers_affected) : null,
              severity: v.severity,
            }),
          () => setV(blank),
        );
      }}
    >
      <CommonFields t={t} label={label} v={v} set={set} />
      <label>
        {t.issue}
        <textarea required minLength={5} maxLength={1500} rows={3} value={v.issue} onChange={(e) => set("issue", e.target.value)} />
      </label>
      <div className="form-row">
        <label>
          {t.affected}
          <input type="number" min={0} value={v.farmers_affected} onChange={(e) => set("farmers_affected", e.target.value)} />
        </label>
        <label>
          {t.severity}
          <select value={v.severity} onChange={(e) => set("severity", e.target.value)}>
            {["low", "medium", "high"].map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FormFooter t={t} state={state} error={error} label={t.send} />
    </form>
  );
}

function FormFooter({ t, state, error, label }: { t: Text; state: string; error: string; label: string }) {
  return (
    <div className="form-footer">
      <button type="submit" className="primary-button" disabled={state === "saving"}>
        {state === "saving" ? t.saving : label}
      </button>
      {state === "saved" && !error && <span className="form-ok">{t.saved}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

function RecordTable({ rows, t, label }: { rows: FieldRecord[]; t: Text; label: (k: string) => string }) {
  if (rows.length === 0) return <p className="empty">{t.none}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t.problem}</th>
            <th>{t.farmer}</th>
            <th>{t.district}</th>
            <th>{t.crop}</th>
            <th>{t.followUp}</th>
            <th>{t.when}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="q-cell">
                {r.problem}
                {r.advice && <span className="cell-sub">{r.advice}</span>}
              </td>
              <td>{r.farmer_ref ?? "–"}</td>
              <td>{[r.district, r.sector].filter(Boolean).join(", ") || "–"}</td>
              <td>{[r.crop && label(r.crop), r.dimension && label(r.dimension)].filter(Boolean).join(" · ") || "–"}</td>
              <td className="nowrap">{r.follow_up_date ?? "–"}</td>
              <td className="nowrap">{r.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
