import type { Source } from "@/lib/types";

interface Props {
  sources: Source[];
  label: string;
}

export default function SourceList({ sources, label }: Props) {
  if (sources.length === 0) return null;
  return (
    <div className="sources">
      <p className="sources-label">{label}</p>
      <ul>
        {sources.map((s) => (
          <li key={s.title}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
            ) : (
              s.title
            )}
            {s.source && <span className="source-org"> ({s.source})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
