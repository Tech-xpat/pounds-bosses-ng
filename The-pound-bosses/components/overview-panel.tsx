"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function OverviewPanel() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          setLoading(false)
          return
        }

        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data())
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-[150px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[100px]" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Skeleton className="h-8 w-[120px]" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Available for Withdrawal</CardTitle>
        <CardDescription>Your current balance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₦{userData?.availableForWithdrawal?.toLocaleString() || "0"}</div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => router.push("/banking")}>
          Go to Banking
        </Button>
      </CardFooter>
    </Card>
  )
}

