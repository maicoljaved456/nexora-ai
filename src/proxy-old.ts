import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/assistants",
  "/approvals",
  "/activity",
  "/research",
  "/leads",
  "/settings",
];

export function proxy(request: NextRequest) {
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) =>
      cookie.name.includes("auth-token")
    );

  if (!hasAuthCookie) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
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