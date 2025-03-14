"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ReferralStats() {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userData) {
      setLoading(false)
    }
  }, [userData])

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{userData?.referrals?.length || 0}</div>
        <p className="text-xs text-muted-foreground">
          {userData?.referralEarnings
            ? `₦${userData.referralEarnings.toLocaleString()} earned from referrals`
            : "No referral earnings yet"}
        </p>
      </CardContent>
    </Card>
  )
}

