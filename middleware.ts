import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/events") ||
    pathname.startsWith("/admin/signin") ||
    pathname === "/" ||
    pathname.startsWith("/events/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Check authentication for admin routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/signin", request.url));
    }

    try {
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL("/admin/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (auth endpoints)
     * - api/events (public event endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    "/((?!api/auth|api/events|_next/static|_next/image|favicon.ico|icons|images).*)",
  ],
};
