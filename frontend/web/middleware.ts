// Protects the extension officer and MINAGRI/RAB dashboards (and their API proxies).
// Farmers' pages (chat, "My farm") stay open: they never ask for a name or phone number.
import { NextResponse, type NextRequest } from "next/server";
import { HOME, readSession, rolesFor, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowed = rolesFor(pathname, request.method);
  if (!allowed) return NextResponse.next();

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isApi = pathname.startsWith("/api/");

  if (!session) {
    if (isApi) return NextResponse.json({ detail: "Please log in." }, { status: 401 });
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (!allowed.includes(session.role)) {
    if (isApi) return NextResponse.json({ detail: "Your account cannot do this." }, { status: 403 });
    return NextResponse.redirect(new URL(HOME[session.role], request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/extension/:path*", "/insights/:path*", "/api/extension/:path*", "/api/insights/:path*"],
};
