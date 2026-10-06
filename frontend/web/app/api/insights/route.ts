// Server-side proxy for the insights page: adds the API key so it never reaches the browser.
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const apiKey = process.env.BACKEND_API_KEY ?? "";
  const days = new URL(request.url).searchParams.get("days") ?? "30";

  try {
    const res = await fetch(`${backendUrl}/insights?days=${encodeURIComponent(days)}`, {
      headers: apiKey ? { "X-API-Key": apiKey } : {},
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
