import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const protectedRoutes = [
    "/dashboard",
    "/assistants",
    "/approvals",
    "/activity",
    "/research",
    "/leads",
    "/settings",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasSupabaseSession =
    request.cookies.has("sb-access-token") ||
    request.cookies
      .getAll()
      .some((cookie) => cookie.name.includes("auth-token"));

  if (!hasSupabaseSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assistants/:path*",
    "/approvals/:path*",
    "/activity/:path*",
    "/research/:path*",
    "/leads/:path*",
    "/settings/:path*",
  ],
};