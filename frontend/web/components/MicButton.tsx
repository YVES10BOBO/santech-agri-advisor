"use client";

import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "@/lib/api";
import { recordingToWav } from "@/lib/wav";
import type { Language } from "@/lib/types";

const MAX_SECONDS = 60;

interface Props {
  language: Language;
  disabled: boolean;
  labels: { start: string; stop: string; listening: string; transcribing: string };
  onText: (text: string) => void;
  onStatus: (message: string) => void;
  messages: { check: string; denied: string; failed: string };
}

// Records the farmer's voice, converts it to WAV and asks the backend for a transcript.
// The transcript goes into the question box so the farmer can check it before sending.
export default function MicButton({ language, disabled, labels, onText, onStatus, messages }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [supported, setSupported] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The microphone only works on https or localhost; hide the button elsewhere.
  useEffect(() => {
    setSupported(Boolean(navigator.mediaDevices?.getUserMedia) && "MediaRecorder" in window);
  }, []);

  async function start() {
    onStatus("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onStatus(messages.denied);
      return;
    }
    const rec = new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timer.current) clearTimeout(timer.current);
      setState("transcribing");
      onStatus(labels.transcribing);
      try {
        const wav = await recordingToWav(new Blob(chunks.current, { type: rec.mimeType }));
        const { text } = await transcribeAudio(wav, language);
        if (text.trim()) {
          onText(text.trim());
          onStatus(messages.check);
        } else {
          onStatus(messages.failed);
        }
      } catch (err) {
        console.error(err);
        onStatus(messages.failed);
      } finally {
        setState("idle");
      }
    };
    recorder.current = rec;
    rec.start();
    setState("recording");
    onStatus(labels.listening);
    timer.current = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_SECONDS * 1000);
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  if (!supported) return null;

  const recording = state === "recording";
  const label = recording ? labels.stop : labels.start;
  return (
    <button
      type="button"
      className={`mic-button${recording ? " is-recording" : ""}`}
      onClick={recording ? stop : start}
      disabled={disabled || state === "transcribing"}
      title={label}
      aria-label={label}
      aria-pressed={recording}
    >
      {state === "transcribing" ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            d={
              recording
                ? "M7 7h10v10H7z"
                : "M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
            }
          />
        </svg>
      )}
    </button>
  );
}
