// Login for the extension officer and MINAGRI/RAB dashboards. Farmers never log in.
// Accounts come from the AUTH_USERS setting ("username:password:role;..."), never from code.
// The session is a signed cookie (HMAC-SHA256 with AUTH_SECRET), checked in middleware.ts.
// Uses Web Crypto only, so it runs in the Edge middleware as well as in route handlers.

export type Role = "extension" | "minagri";

export interface Session {
  user: string;
  role: Role;
  exp: number; // seconds since epoch
}

export const SESSION_COOKIE = "santech-session";
export const SESSION_HOURS = 8;

const ROLES: Role[] = ["extension", "minagri"];
const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(data: string): Promise<Uint8Array> {
  const secret = process.env.AUTH_SECRET ?? "";
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

// Constant-time comparison, so wrong guesses do not leak timing information.
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function authConfigured(): boolean {
  return (process.env.AUTH_SECRET ?? "").length >= 16 && accounts().length > 0;
}

function accounts(): { user: string; password: string; role: Role }[] {
  return (process.env.AUTH_USERS ?? "")
    .split(";")
    .map((entry) => entry.trim().split(":"))
    .filter((p) => p.length === 3 && p[0] && p[1] && ROLES.includes(p[2] as Role))
    .map(([user, password, role]) => ({ user: user.trim(), password, role: role as Role }));
}

export async function checkLogin(user: string, password: string): Promise<Role | null> {
  const wanted = encoder.encode(password);
  let found: Role | null = null;
  for (const a of accounts()) {
    // Compare every account so the response time does not reveal which usernames exist.
    const ok = a.user.toLowerCase() === user.trim().toLowerCase() && sameBytes(encoder.encode(a.password), wanted);
    if (ok) found = a.role;
  }
  return found;
}

export async function createSession(user: string, role: Role): Promise<string> {
  const session: Session = { user, role, exp: Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600 };
  const payload = b64url(encoder.encode(JSON.stringify(session)));
  return `${payload}.${b64url(await hmac(payload))}`;
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token || !authConfigured()) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    if (!sameBytes(fromB64url(sig), await hmac(payload))) return null;
    const session = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as Session;
    if (!ROLES.includes(session.role) || session.exp < Date.now() / 1000) return null;
    return session;
  } catch {
    return null;
  }
}

/** Which roles may open a page or API path. MINAGRI/RAB may also see the officer tools. */
export function rolesFor(path: string, method: string): Role[] | null {
  if (path.startsWith("/insights") || path.startsWith("/api/insights")) return ["minagri"];
  // Only MINAGRI/RAB answer and close escalations.
  if (/^\/api\/extension\/escalations\/\d+$/.test(path) && method === "PATCH") return ["minagri"];
  if (path.startsWith("/extension") || path.startsWith("/api/extension")) return ["extension", "minagri"];
  return null; // public: chat, farmer page, ask
}

/** Where each role lands after logging in. */
export const HOME: Record<Role, string> = { extension: "/extension", minagri: "/insights" };
