import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Get the auth token from cookies or authorization header
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
    path.startsWith("/_next/") ||
    path.includes("favicon.ico") ||
    path.includes(".png") ||
    path.includes(".jpg") ||
    path.includes(".svg")

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
  if ((path === "/sign-in" || path === "/sign-up") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect unauthenticated users to sign-in
  if (isProtectedPath && !isAuthenticated) {
    // Store the original URL to redirect back after login
    const url = new URL("/sign-in", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

