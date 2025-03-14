"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { AdminNav } from "@/components/admin/admin-nav"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Loader2 } from "lucide-react"

interface AdminShellProps {
  children?: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser

        if (!user) {
          // User not logged in, redirect to sign in
          router.push("/sign-in")
          return
        }

        // Check if user is admin
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const userData = userDoc.data()

        if (!userData?.isAdmin) {
          // User is not admin, redirect to dashboard
          router.push("/dashboard")
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/sign-in")
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <AdminNav />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden">{children}</main>
      </div>
      <SiteFooter />
    </div>
  )
}

