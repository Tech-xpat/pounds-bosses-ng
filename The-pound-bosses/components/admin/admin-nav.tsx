"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AdminNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string
    title: string
  }[]
}

export function AdminNav({ className, items, ...props }: AdminNavProps) {
  const pathname = usePathname()

  const defaultItems = [
    {
      href: "/admin",
      title: "Overview",
    },
    {
      href: "/admin/users",
      title: "Users",
    },
    {
      href: "/admin/transactions",
      title: "Transactions",
    },
    {
      href: "/admin/tasks",
      title: "Tasks",
    },
    {
      href: "/admin/settings",
      title: "Settings",
    },
  ]

  const navItems = items || defaultItems

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "default" : "ghost"}
            size="sm"
            className="justify-start"
            asChild
          >
            <Link href={item.href}>{item.title}</Link>
          </Button>
        ))}
      </ScrollArea>
    </nav>
  )
}

