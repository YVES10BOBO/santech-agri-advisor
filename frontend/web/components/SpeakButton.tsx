"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  labels: { listen: string; stop: string; preparing: string; failed: string };
}

// Reads an answer aloud. The audio is fetched once per answer and kept for replays.
export default function SpeakButton({ text, labels }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);

  useEffect(
    () => () => {
      audio.current?.pause();
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );

  async function play() {
    if (!url.current) {
      setState("loading");
      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`Speak failed (${res.status})`);
        url.current = URL.createObjectURL(await res.blob());
      } catch (err) {
        console.error(err);
        setState("error");
        return;
      }
    }
    const a = new Audio(url.current);
    a.onended = () => setState("idle");
    audio.current = a;
    await a.play();
    setState("playing");
  }

  function stop() {
    audio.current?.pause();
    setState("idle");
  }

  const playing = state === "playing";
  return (
    <button
      type="button"
      className={`speak-button${playing ? " is-playing" : ""}`}
      onClick={playing ? stop : play}
      disabled={state === "loading"}
      aria-pressed={playing}
    >
      {state === "loading" ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d={
              playing
                ? "M7 7h10v10H7z"
                : "M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4ZM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6Z"
            }
          />
        </svg>
      )}
      <span>
        {state === "loading"
          ? labels.preparing
          : state === "error"
            ? labels.failed
            : playing
              ? labels.stop
              : labels.listen}
      </span>
    </button>
  );
}
