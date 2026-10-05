// Server-side proxy for speech-to-text: forwards the recording to FastAPI /transcribe
// and adds the API key, so the key never reaches the browser.
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const apiKey = process.env.BACKEND_API_KEY ?? "";

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ detail: "Invalid form data." }, { status: 400 });
  }

  try {
    const res = await fetch(`${backendUrl}/transcribe`, {
      method: "POST",
      headers: apiKey ? { "X-API-Key": apiKey } : {},
      body: form,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ detail: "Invalid backend response." }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: `Backend not reachable at ${backendUrl}.` },
      { status: 502 },
    );
  }
}
