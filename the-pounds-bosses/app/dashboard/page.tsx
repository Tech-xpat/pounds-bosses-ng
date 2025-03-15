"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

// Import components with explicit .tsx extension
import { UserStats } from "@/components/user-stats"
import { ReferralStats } from "@/components/referral-stats"
import { RecentTransactions } from "@/components/recent-transactions"
import { TaskList } from "@/components/task-list"

export default function DashboardPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in")
      return
    }

    if (user && userData) {
      setLoading(false)
    }
  }, [user, userData, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between px-2">
        <div className="grid gap-1">
          <h1 className="text-3xl font-bold md:text-4xl">Dashboard</h1>
          <p className="text-lg text-muted-foreground">Welcome to your dashboard</p>
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

