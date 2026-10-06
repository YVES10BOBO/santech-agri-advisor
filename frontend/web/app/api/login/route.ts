// Login and logout for the extension officer and MINAGRI/RAB dashboards.
import { NextResponse } from "next/server";
import {
  authConfigured, checkLogin, createSession, HOME, readSession, SESSION_COOKIE, SESSION_HOURS,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!authConfigured()) {
    return NextResponse.json(
      { detail: "Login is not set up: add AUTH_SECRET and AUTH_USERS to the server settings." },
      { status: 503 },
    );
  }
  let body: { user?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request." }, { status: 400 });
  }
  const user = typeof body.user === "string" ? body.user.slice(0, 80) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  const role = await checkLogin(user, password);
  if (!role) {
    await new Promise((r) => setTimeout(r, 600)); // slows down password guessing
    return NextResponse.json({ detail: "Wrong username or password." }, { status: 401 });
  }

  const res = NextResponse.json({ user: user.trim(), role, home: HOME[role] });
  res.cookies.set(SESSION_COOKIE, await createSession(user.trim(), role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}

// Who is logged in (the dashboards show the name and a logout button).
export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`))?.split("=")[1];
  const session = await readSession(token);
  return NextResponse.json(session ? { user: session.user, role: session.role } : null);
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
