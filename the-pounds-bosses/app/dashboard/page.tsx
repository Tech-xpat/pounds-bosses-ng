"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

// Import components with explicit .tsx extension
import { UserStats } from "@/components/user-stats"
import { ReferralStats } from "@/components/referral-stats"
import { RecentTransactions } from "@/components/recent-transactions"
import { TaskList } from "@/components/task-list"

export default function DashboardPage() {
  const { user, userData, loading: authLoading, authInitialized } = useAuth()
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl")

  useEffect(() => {
    // Wait for auth to initialize
    if (!authInitialized) return

    // If not authenticated, redirect to sign-in
    if (authInitialized && !user && !authLoading) {
      router.push(`/sign-in${callbackUrl ? `?callbackUrl=${callbackUrl}` : ""}`)
      return
    }

    // If authenticated but no user data yet, wait for it
    if (user && !userData && !authLoading) {
      setLoading(true)
      return
    }

    // Once we have user data, we're ready to render
    if (user && userData) {
      setLoading(false)
    }
  }, [user, userData, authLoading, authInitialized, router, callbackUrl])

  // Show loading state while authentication is being checked
  if (authLoading || loading || !authInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // If no user or userData, don't render anything (will redirect in useEffect)
  if (!user || !userData) {
    return null
  }

  return (
    <div className="grid items-start gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between px-2">
        <div className="grid gap-1">
          <h1 className="text-3xl font-bold md:text-4xl">Dashboard</h1>
          <p className="text-lg text-muted-foreground">Welcome, {userData.username}</p>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <UserStats />
            <ReferralStats />
          </div>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your recent transactions across all accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <TaskList />
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>View all your transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTransactions showAll />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

