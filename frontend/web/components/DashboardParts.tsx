"use client";

// Pieces shared by the three dashboards (farmer, extension officer, MINAGRI/RAB).
import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import type { Language } from "@/lib/types";

export interface Row {
  key: string;
  questions: number;
}

export const LABELS: Record<Language, Record<string, string>> = {
  rw: {
    maize: "Ibigori", beans: "Ibishyimbo", potato: "Ibirayi", general: "Rusange", other: "Ibindi",
    pest_disease: "Indwara n'ibyonnyi", fertilizer_inputs: "Ifumbire", seeds_planting: "Imbuto no gutera",
    weeds: "Ibyatsi bibi", soil_water_fertility: "Ubutaka n'amazi", post_harvest: "Nyuma yo gusarura",
    weather: "Ikirere", government_programs: "Gahunda za Leta", off_topic: "Bitari iby'ubuhinzi",
    livestock: "Amatungo", market_access: "Inyongeramusaruro n'isoko",
    not_detected: "Ntibyamenyekanye", rw: "Ikinyarwanda", en: "Icyongereza",
    web_api: "Urubuga / API", sms_ussd: "SMS / USSD", photo: "Ifoto",
    open: "Gifunguye", reviewing: "Kirimo gusuzumwa", resolved: "Cyakemutse",
    low: "Gito", medium: "Kiringaniye", high: "Gikomeye", not_a_plant: "Si igihingwa",
  },
  en: {
    maize: "Maize", beans: "Beans", potato: "Irish potato", general: "General", other: "Other",
    pest_disease: "Pests & diseases", fertilizer_inputs: "Fertilizer & inputs", seeds_planting: "Seeds & planting",
    weeds: "Weeds", soil_water_fertility: "Soil, water & fertility", post_harvest: "Post-harvest",
    weather: "Weather", government_programs: "Government programs", off_topic: "Not farming",
    livestock: "Livestock", market_access: "Inputs & market access",
    not_detected: "Not detected", rw: "Kinyarwanda", en: "English",
    web_api: "Web / API", sms_ussd: "SMS / USSD", photo: "Photo",
    open: "Open", reviewing: "Reviewing", resolved: "Resolved",
    low: "Low", medium: "Medium", high: "High", not_a_plant: "Not a plant",
  },
};

// The eight C4IR advisory topics, plus the two extra use cases officers meet in the field.
export const TOPICS = [
  "pest_disease", "fertilizer_inputs", "seeds_planting", "weeds", "soil_water_fertility",
  "post_harvest", "weather", "government_programs", "livestock", "market_access", "other",
] as const;

export const labelFor = (language: Language) => (k: string) => LABELS[language][k] ?? k;

export function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {note && <p className="kpi-note">{note}</p>}
    </div>
  );
}

// Ranked horizontal bars: one hue, value printed at the end of each bar.
export function BarList({ rows, label, none }: { rows: Row[]; label: (k: string) => string; none: string }) {
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

const NAV: { href: string; icon: IconName; label: Record<Language, string> }[] = [
  { href: "/chat", icon: "chat", label: { rw: "Ikiganiro", en: "Chat" } },
  { href: "/farmer", icon: "farm", label: { rw: "Umurima wanjye", en: "My farm" } },
  { href: "/extension", icon: "badge", label: { rw: "Abajyanama b'ubuhinzi", en: "Extension officers" } },
  { href: "/insights", icon: "chart", label: { rw: "MINAGRI / RAB", en: "MINAGRI / RAB" } },
];

/** One row of links between the chat and the three dashboards. */
export function DashboardNav({ current, language }: { current: string; language: Language }) {
  return (
    <nav className="dash-nav" aria-label={language === "rw" ? "Imbonerahamwe" : "Dashboards"}>
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={n.href === current ? "is-active" : ""}
          aria-current={n.href === current ? "page" : undefined}
        >
          <Icon name={n.icon} size={16} />
          {n.label[language]}
        </Link>
      ))}
    </nav>
  );
}

/** Page header shared by the dashboards. */
export function DashboardHead({
  icon, title, subtitle, children,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="insights-head">
      <div className="insights-title">
        <span className="brand-mark" aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="insights-actions">{children}</div>
    </header>
  );
}
