import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing admin routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/signin")) {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      // Redirect to signin if no token
      return NextResponse.redirect(new URL("/admin/signin", request.url));
    }

    // Token exists, allow access
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all admin routes except signin
     */
    "/admin/:path*",
  ],
};
