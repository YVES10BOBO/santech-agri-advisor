// Server-side proxy for text-to-speech: forwards the text to FastAPI /speak, adds the
// API key, and streams the WAV audio back to the browser.
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const apiKey = process.env.BACKEND_API_KEY ?? "";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const res = await fetch(`${backendUrl}/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ detail: "Voice not available." }));
      return NextResponse.json(data, { status: res.status });
    }
    return new Response(await res.arrayBuffer(), {
      headers: { "Content-Type": "audio/wav" },
    });
  } catch {
    return NextResponse.json(
      { detail: `Backend not reachable at ${backendUrl}.` },
      { status: 502 },
    );
  }
}
