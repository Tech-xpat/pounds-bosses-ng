import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Get the auth token from cookies or localStorage
  const authCookie = request.cookies.get("auth")?.value
  const authHeader = request.headers.get("authorization")?.split(" ")[1]

  const isAuthenticated = authCookie || authHeader

  // Public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/sign-in" ||
    path === "/sign-up" ||
    path === "/reset-password" ||
    path.startsWith("/verify-email") ||
    path.startsWith("/reset-password-confirm") ||
    path.startsWith("/api/") ||
    path.startsWith("/_next/")

  // Protected paths that require authentication
  const isProtectedPath =
    path.startsWith("/dashboard") ||
    path.startsWith("/referrals") ||
    path.startsWith("/invest") ||
    path.startsWith("/settings") ||
    path.startsWith("/announcements") ||
    path.startsWith("/admin") ||
    path.startsWith("/banking")

  // Redirect authenticated users away from auth pages
  if (isPublicPath && path !== "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect unauthenticated users to sign-in
  if (isProtectedPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

