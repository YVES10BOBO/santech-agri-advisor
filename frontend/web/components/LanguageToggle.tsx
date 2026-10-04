"use client";

import type { Language } from "@/lib/types";

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
}

const options: { value: Language; label: string }[] = [
  { value: "rw", label: "Kinyarwanda" },
  { value: "en", label: "English" },
];

export default function LanguageToggle({ value, onChange }: Props) {
  return (
    <div className="lang-toggle" role="radiogroup" aria-label="Language">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "is-active" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
