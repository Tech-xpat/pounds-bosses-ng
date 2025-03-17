"use client"

import * as React from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname } from "next/navigation"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col gap-4 mt-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/about" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setOpen(false)}
          >
            About
          </Link>
          <Link
            href="/registration-guide"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/registration-guide" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setOpen(false)}
          >
            Guide
          </Link>
          <div className="flex flex-col gap-2 mt-4">
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

