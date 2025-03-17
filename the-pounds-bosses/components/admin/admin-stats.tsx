"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, CreditCard, DollarSign, TrendingUp } from "lucide-react"

export function AdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    loading: true,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, "users"))
        const totalUsers = usersSnapshot.size

        // Get active users (logged in within the last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const activeUsersQuery = query(collection(db, "users"), where("lastLogin", ">=", sevenDaysAgo.toISOString()))
        const activeUsersSnapshot = await getDocs(activeUsersQuery)
        const activeUsers = activeUsersSnapshot.size

        // Get transactions
        const transactionsQuery = query(collection(db, "transactions"), orderBy("timestamp", "desc"))
        const transactionsSnapshot = await getDocs(transactionsQuery)
        const totalTransactions = transactionsSnapshot.size

        // Calculate total revenue (deposits)
        let totalRevenue = 0
        transactionsSnapshot.forEach((doc) => {
          const transaction = doc.data()
          if (transaction.type === "deposit" && transaction.status === "completed") {
            totalRevenue += transaction.amount
          }
        })

        setStats({
          totalUsers,
          totalTransactions,
          totalRevenue,
          activeUsers,
          loading: false,
        })
      } catch (error) {
        console.error("Error fetching admin stats:", error)
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  if (stats.loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">{stats.activeUsers} active in the last 7 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          <p className="text-xs text-muted-foreground">All time platform transactions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From deposits and fees</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">User activity rate</p>
        </CardContent>
      </Card>
    </div>
  )
}

