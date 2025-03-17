"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function UserStats() {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userData) {
      setLoading(false)
    }
  }, [userData])

  if (loading) {
    return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{userData?.balance?.toLocaleString() || "0"}</div>
          <p className="text-xs text-muted-foreground">Available for withdrawal</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{userData?.totalEarnings?.toLocaleString() || "0"}</div>
          <p className="text-xs text-muted-foreground">Total earnings to date</p>
        </CardContent>
      </Card>
    </>
  )
}

