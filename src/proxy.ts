import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistischer Check (nur Cookie vorhanden?). Die echte Prüfung passiert in requireUser().
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/marketing/:path*", "/api/werbemittel/:path*"],
};
