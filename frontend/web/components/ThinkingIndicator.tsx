"use client";

import { useEffect, useState } from "react";

interface Props {
  steps: { after: number; text: string }[];
}

// Shown while the backend prepares an answer. Steps follow the pipeline order
// (read question → search knowledge → write answer); they are timed, not live progress.
export default function ThinkingIndicator({ steps }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(timer);
  }, []);

  const current = [...steps].reverse().find((s) => seconds >= s.after) ?? steps[0];

  return (
    <div className="thinking" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="thinking-text">{current.text}</span>
      <span className="thinking-time">{seconds} s</span>
    </div>
  );
}
