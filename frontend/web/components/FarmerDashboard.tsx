"use client";

// The farmer's own page (C4IR "primary users"): a farm profile that makes every answer
// fit their district, farm size and means, questions for this season, and the ways
// to reach the advisor without internet (USSD, SMS).
import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHead, DashboardNav, labelFor } from "./DashboardParts";
import Icon from "./Icon";
import LanguageToggle from "./LanguageToggle";
import { loadConversations, type Conversation } from "@/lib/history";
import {
  clearProfile, emptyProfile, hasProfile, loadProfile, RWANDA_DISTRICTS, saveProfile, seasonOf,
  type FarmerProfile,
} from "@/lib/profile";
import { USSD_CODE, type Crop } from "@/lib/strings";
import type { Language } from "@/lib/types";

const CROPS: Crop[] = ["maize", "beans", "potato"];
const CROP_RW: Record<Crop, string> = { maize: "ibigori", beans: "ibishyimbo", potato: "ibirayi" };
const CROP_EN: Record<Crop, string> = { maize: "maize", beans: "beans", potato: "Irish potatoes" };

// Questions only: the answers come from the advisor, grounded in RAB/MINAGRI documents.
function seasonQuestions(language: Language, crop: Crop): string[] {
  if (language === "rw") {
    const c = CROP_RW[crop];
    return [
      `Ni iki nkwiye gukora ku ${c} byanjye muri iki gihembwe?`,
      `Ni ifumbire ingana iki nakoresha ku ${c} ku murima wanjye?`,
      `Ni izihe ndwara n'ibyonnyi nkwiye kwitondera ku ${c} ubu?`,
    ];
  }
  const c = CROP_EN[crop];
  return [
    `What should I do for my ${c} this season?`,
    `How much fertilizer should I use on ${c} for my farm?`,
    `Which pests and diseases should I watch for on my ${c} now?`,
  ];
}

const TEXT = {
  rw: {
    title: "Umurima wanjye",
    subtitle: "Uzuza ibijyanye n'umurima wawe, inama zihuze n'ibyo ufite",
    profile: "Ibijyanye n'umurima wanjye",
    profileHint: "Bibikwa kuri iyi telefoni gusa. Nta zina cyangwa nimero ya telefoni dusaba.",
    district: "Akarere",
    size: "Ingano y'umurima (hegitari)",
    sizeHint: "Urugero: 0.25",
    crops: "Ibihingwa mpinga",
    irrigation: "Mfite uburyo bwo kuhira",
    livestock: "Norora amatungo (mfite ifumbire y'imborera)",
    yes: "Yego",
    no: "Oya",
    unknown: "Simbizi",
    notes: "Ikindi twamenya",
    notesHint: "Urugero: umurima uri ku musozi, nta mafaranga y'ifumbire mvaruganda",
    choose: "Hitamo",
    save: "Bika",
    saved: "Byabitswe. Ibisubizo bizajya bihuzwa n'umurima wawe.",
    clear: "Siba",
    active: "Inama zihuzwa n'umurima wawe",
    inactive: "Uzuza umwirondoro kugira ngo inama zihuze n'umurima wawe.",
    season: "Iki gihembwe",
    seasonA: "Igihembwe A (Nzeri – Mutarama)",
    seasonB: "Igihembwe B (Gashyantare – Kamena)",
    seasonC: "Igihe cy'izuba (Nyakanga – Kanama) · Igihembwe C mu bishanga n'ahuhirwa",
    seasonHint: "Kanda ikibazo kugira ngo ugibaze umujyanama.",
    pickCrops: "Hitamo ibihingwa byawe hejuru kugira ngo ubone ibibazo bibireba.",
    inputs: "Inyongeramusaruro n'isoko",
    inputsQ: "Ni hehe nabona imbuto nziza n'ifumbire hafi yanjye, kandi nagurisha he umusaruro wanjye?",
    recent: "Ibiganiro byanjye biheruka",
    noRecent: "Nta kiganiro kirabaho.",
    reach: "Uko wabona",
    reachChat: "Ikiganiro: andika, vuga cyangwa ohereza ifoto y'igihingwa kirwaye.",
    reachUssd: "Telefoni isanzwe: kanda {code} ubundi ubaze ikibazo, igisubizo kikugereho kuri SMS.",
    reachSms: "SMS: ohereza ikibazo cyawe, usubizwe kuri SMS.",
    ask: "Baza",
  },
  en: {
    title: "My farm",
    subtitle: "Tell us about your farm so advice fits what you have",
    profile: "About my farm",
    profileHint: "Kept on this phone only. We do not ask for your name or phone number.",
    district: "District",
    size: "Farm size (hectares)",
    sizeHint: "For example: 0.25",
    crops: "Crops I grow",
    irrigation: "I can irrigate",
    livestock: "I keep livestock (I have manure)",
    yes: "Yes",
    no: "No",
    unknown: "Not sure",
    notes: "Anything else",
    notesHint: "For example: hillside farm, no money for mineral fertilizer",
    choose: "Choose",
    save: "Save",
    saved: "Saved. Answers will now fit your farm.",
    clear: "Clear",
    active: "Advice is fitted to your farm",
    inactive: "Fill in your farm so advice fits it.",
    season: "This season",
    seasonA: "Season A (September – January)",
    seasonB: "Season B (February – June)",
    seasonC: "Dry period (July – August) · Season C in marshlands and irrigated land",
    seasonHint: "Tap a question to ask the advisor.",
    pickCrops: "Choose your crops above to see questions for them.",
    inputs: "Inputs and market",
    inputsQ: "Where can I get good seed and fertilizer near me, and where can I sell my harvest?",
    recent: "My recent chats",
    noRecent: "No chats yet.",
    reach: "How to reach the advisor",
    reachChat: "Chat: type, speak, or send a photo of a sick plant.",
    reachUssd: "Basic phone: dial {code} and ask your question; the answer comes by SMS.",
    reachSms: "SMS: send your question and get the answer by SMS.",
    ask: "Ask",
  },
};

type Tri = "yes" | "no" | "";
const toTri = (b?: boolean): Tri => (b === undefined ? "" : b ? "yes" : "no");
const fromTri = (v: Tri): boolean | undefined => (v === "" ? undefined : v === "yes");

export default function FarmerDashboard() {
  const [language, setLanguage] = useState<Language>("rw");
  const [profile, setProfile] = useState<FarmerProfile>(emptyProfile);
  const [saved, setSaved] = useState(false);
  const [active, setActive] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const t = TEXT[language];
  const label = labelFor(language);

  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);
    setActive(hasProfile(stored));
    setConversations(loadConversations().slice(0, 5));
  }, []);

  function update(p: Partial<FarmerProfile>) {
    setProfile((cur) => ({ ...cur, ...p }));
    setSaved(false);
  }

  function toggleCrop(c: Crop) {
    update({ crops: profile.crops.includes(c) ? profile.crops.filter((x) => x !== c) : [...profile.crops, c] });
  }

  function save() {
    const clean: FarmerProfile = {
      crops: profile.crops,
      district: profile.district || undefined,
      farm_size_ha: profile.farm_size_ha && profile.farm_size_ha > 0 ? Math.min(profile.farm_size_ha, 100) : undefined,
      irrigation: profile.irrigation,
      livestock: profile.livestock,
      notes: profile.notes?.trim() || undefined,
    };
    saveProfile(clean);
    setProfile(clean);
    setActive(hasProfile(clean));
    setSaved(true);
  }

  function clear() {
    clearProfile();
    setProfile(emptyProfile);
    setActive(false);
    setSaved(false);
  }

  const season = seasonOf(new Date().getMonth() + 1);
  const ask = (q: string) => `/chat?q=${encodeURIComponent(q)}`;

  return (
    <div className="insights">
      <DashboardNav current="/farmer" language={language} />
      <DashboardHead icon="farm" title={t.title} subtitle={t.subtitle}>
        <LanguageToggle value={language} onChange={setLanguage} />
      </DashboardHead>

      <main className="insights-grid">
        <section className="panel">
          <h2>{t.profile}</h2>
          <p className={`profile-state${active ? " is-on" : ""}`}>
            <Icon name="leaf" size={16} />
            {active ? t.active : t.inactive}
          </p>
          <form
            className="dash-form"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="form-row">
              <label>
                {t.district}
                <select value={profile.district ?? ""} onChange={(e) => update({ district: e.target.value })}>
                  <option value="">{t.choose}</option>
                  {RWANDA_DISTRICTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                {t.size}
                <input
                  type="number"
                  min={0.01}
                  max={100}
                  step={0.01}
                  placeholder={t.sizeHint}
                  value={profile.farm_size_ha ?? ""}
                  onChange={(e) => update({ farm_size_ha: e.target.value ? Number(e.target.value) : undefined })}
                />
              </label>
            </div>
            <fieldset className="check-row">
              <legend>{t.crops}</legend>
              {CROPS.map((c) => (
                <label key={c} className="check">
                  <input type="checkbox" checked={profile.crops.includes(c)} onChange={() => toggleCrop(c)} />
                  {label(c)}
                </label>
              ))}
            </fieldset>
            <div className="form-row">
              <TriSelect t={t} label={t.irrigation} value={toTri(profile.irrigation)} onChange={(v) => update({ irrigation: fromTri(v) })} />
              <TriSelect t={t} label={t.livestock} value={toTri(profile.livestock)} onChange={(v) => update({ livestock: fromTri(v) })} />
            </div>
            <label>
              {t.notes}
              <input
                maxLength={200}
                placeholder={t.notesHint}
                value={profile.notes ?? ""}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </label>
            <p className="panel-hint">{t.profileHint}</p>
            <div className="form-footer">
              <button type="submit" className="primary-button">
                {t.save}
              </button>
              <button type="button" className="ghost-button" onClick={clear}>
                {t.clear}
              </button>
              {saved && <span className="form-ok">{t.saved}</span>}
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>{t.season}</h2>
          <p className="season-badge">{season === "A" ? t.seasonA : season === "B" ? t.seasonB : t.seasonC}</p>
          {profile.crops.length === 0 ? (
            <p className="empty">{t.pickCrops}</p>
          ) : (
            <>
              <p className="panel-hint">{t.seasonHint}</p>
              {profile.crops.map((c) => (
                <div key={c} className="quick-group">
                  <p className="quick-crop">{label(c)}</p>
                  {seasonQuestions(language, c).map((q) => (
                    <Link key={q} href={ask(q)} className="quick-q">
                      {q}
                    </Link>
                  ))}
                </div>
              ))}
            </>
          )}
          <div className="quick-group">
            <p className="quick-crop">{t.inputs}</p>
            <Link href={ask(t.inputsQ)} className="quick-q">
              {t.inputsQ}
            </Link>
          </div>
        </section>

        <section className="panel">
          <h2>{t.recent}</h2>
          {conversations.length === 0 ? (
            <p className="empty">{t.noRecent}</p>
          ) : (
            <ul className="doc-list">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Icon name="chat" size={16} />
                  <span className="doc-title">
                    <Link href="/chat">{c.title}</Link>
                    <small>{new Date(c.updatedAt).toLocaleDateString(language === "rw" ? "rw-RW" : "en-GB")}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>{t.reach}</h2>
          <ul className="reach-list">
            <li>
              <Icon name="chat" size={18} />
              <span>{t.reachChat}</span>
            </li>
            <li>
              <Icon name="phone" size={18} />
              <span>
                {t.reachUssd.split("{code}")[0]}
                <strong className="ussd-code">{USSD_CODE}</strong>
                {t.reachUssd.split("{code}")[1]}
              </span>
            </li>
            <li>
              <Icon name="type" size={18} />
              <span>{t.reachSms}</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function TriSelect({
  t, label, value, onChange,
}: {
  t: (typeof TEXT)["rw"];
  label: string;
  value: Tri;
  onChange: (v: Tri) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as Tri)}>
        <option value="">{t.unknown}</option>
        <option value="yes">{t.yes}</option>
        <option value="no">{t.no}</option>
      </select>
    </label>
  );
}
