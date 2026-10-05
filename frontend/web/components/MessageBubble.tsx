import SourceList from "./SourceList";
import Icon from "./Icon";
import SpeakButton from "./SpeakButton";
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
      {!isFarmer && (
        <span className="avatar" aria-hidden="true">
          <Icon name="leaf" size={18} />
        </span>
      )}
      <div className="message-body">
        <p className="message-author">{isFarmer ? t.you : t.advisor}</p>
        <div className={`bubble${message.error ? " is-error" : ""}`}>
          {message.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="message-photo" src={message.imageUrl} alt={t.photoOnly} />
          )}
          {!message.imageUrl && message.hadPhoto && (
            <p className="photo-not-kept">
              <Icon name="camera" size={16} /> {t.photoNotKept}
            </p>
          )}
          <p className="message-text">{message.text}</p>
          {r && (
            <SpeakButton
              text={r.answer}
              labels={{
                listen: t.listen,
                stop: t.stopListening,
                preparing: t.preparingAudio,
                failed: t.audioFailed,
              }}
            />
          )}
          {r && <SourceList sources={r.sources} label={t.sources} />}
        </div>
        {r && (
          <dl className="message-meta">
            {r.photo && r.photo.is_plant && (
              <div>
                <dt>{t.photoFinding}</dt>
                <dd>
                  {r.photo.problem} ({t.confidence}: {t[`conf_${r.photo.confidence}`]})
                </dd>
              </div>
            )}
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
      </div>
    </article>
  );
}
