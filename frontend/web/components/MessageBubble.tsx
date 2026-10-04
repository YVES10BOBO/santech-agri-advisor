import SourceList from "./SourceList";
import type { ChatMessage, Language } from "@/lib/types";
import { strings } from "@/lib/strings";

interface Props {
  message: ChatMessage;
  uiLanguage: Language;
}

export default function MessageBubble({ message, uiLanguage }: Props) {
  const t = strings[uiLanguage];
  const r = message.response;
  const isFarmer = message.role === "farmer";

  return (
    <article className={`message ${isFarmer ? "from-farmer" : "from-advisor"}`}>
      <p className="message-author">{isFarmer ? t.you : t.advisor}</p>
      <div className={`bubble${message.error ? " is-error" : ""}`}>
        <p className="message-text">{message.text}</p>
        {r && <SourceList sources={r.sources} label={t.sources} />}
      </div>
      {r && (
        <dl className="message-meta">
          {r.crop && (
            <div>
              <dt>{t.crop}</dt>
              <dd>{r.crop}</dd>
            </div>
          )}
          {r.dimension && (
            <div>
              <dt>{t.topic}</dt>
              <dd>{r.dimension.replaceAll("_", " ")}</dd>
            </div>
          )}
          <div>
            <dt>{t.time}</dt>
            <dd>{(r.latency_ms / 1000).toFixed(1)} s</dd>
          </div>
        </dl>
      )}
    </article>
  );
}
