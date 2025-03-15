"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileNav } from "@/components/mobile-nav"
import { usePathname, useRouter } from "next/navigation"

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()

  // Don't show header on admin pages
  if (pathname?.startsWith("/admin")) {
    return null
  }

  // Don't show header on dashboard pages (mobile)
  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/referrals") ||
    pathname?.startsWith("/invest") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/announcements")
  ) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background md:block hidden">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">Pounds Bosses</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Pounds Bosses</span>
          </Link>
          <nav className="hidden md:flex gap-6 ml-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/about" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              About
            </Link>
            <Link
              href="/registration-guide"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/registration-guide" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Guide
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <div className="hidden md:flex gap-2">
            {pathname !== "/sign-in" && (
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
            {pathname !== "/sign-up" && (
              <Button asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            )}
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

