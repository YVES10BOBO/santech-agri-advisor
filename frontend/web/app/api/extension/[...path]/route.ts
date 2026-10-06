// Server-side proxy for the extension officer tools (/extension/... on FastAPI).
// Adds the API key so it never reaches the browser; only known paths are forwarded.
import { NextResponse } from "next/server";

// AI answers can take 10-30 s; Vercel's default limit could cut them off.
export const maxDuration = 60;

const ALLOWED = /^(summary|records|escalations|escalations\/\d+|knowledge)$/;

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(request: Request, { params }: Ctx, method: string) {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const apiKey = process.env.BACKEND_API_KEY ?? "";
  const path = (await params).path.join("/");
  if (!ALLOWED.test(path)) {
    return NextResponse.json({ detail: "Not found." }, { status: 404 });
  }
  const query = new URL(request.url).search;
  const headers: Record<string, string> = apiKey ? { "X-API-Key": apiKey } : {};
  let body: string | undefined;
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    body = await request.text();
  }

  try {
    const res = await fetch(`${backendUrl}/extension/${path}${query}`, {
      method,
      headers,
      body,
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

export const GET = (request: Request, ctx: Ctx) => forward(request, ctx, "GET");
export const POST = (request: Request, ctx: Ctx) => forward(request, ctx, "POST");
export const PATCH = (request: Request, ctx: Ctx) => forward(request, ctx, "PATCH");
