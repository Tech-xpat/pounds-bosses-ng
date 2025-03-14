"use client"

import { useState, useEffect } from "react"
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3"
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface FundAccountProps {
  onSuccess?: (amount: number) => void
  className?: string
}

export function FundAccount({ onSuccess, className }: FundAccountProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userData, setUserData] = useState<any>(null)
  const [verifying, setVerifying] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user?.uid) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data())
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
    tx_ref: `fund-${user?.uid}-${Date.now()}`,
    amount: Number.parseFloat(amount) || 0,
    currency: "NGN",
    payment_options: "card,banktransfer,ussd",
    customer: {
      email: user?.email || "",
      phone_number: userData?.phone || "",
      name: userData?.fullName || user?.displayName || "",
    },
    customizations: {
      title: "Account Funding",
      description: "Fund your account",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  }

  const handleFlutterPayment = useFlutterwave(config)

  const handleFundAccount = () => {
    setError("")
    setSuccess("")

    const fundAmount = Number.parseFloat(amount)
    if (isNaN(fundAmount) || fundAmount < 1000) {
      setError("Minimum funding amount is ₦1,000")
      return
    }

    handleFlutterPayment({
      callback: (response) => {
        console.log("Payment response:", response)
        if (response.status === "successful") {
          verifyPayment(response.transaction_id, fundAmount)
        } else {
          setError("Payment was not successful. Please try again.")
        }
        closePaymentModal()
      },
      onClose: () => {
        console.log("Payment closed")
      },
    })
  }

  const verifyPayment = async (transactionId: string, amount: number) => {
    setVerifying(true)
    try {
      // Call your backend to verify the payment
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          txRef: config.tx_ref,
          userId: user.uid,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update user's balance in Firestore
        const userRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const currentBalance = userData.availableForWithdrawal || 0
          const totalEarnings = userData.totalEarnings || 0

          await updateDoc(userRef, {
            availableForWithdrawal: currentBalance + amount,
            totalEarnings: totalEarnings + amount,
            transactions: [
              {
                id: `dep-${Date.now()}`,
                type: "deposit",
                amount: amount,
                date: new Date().toISOString(),
                status: "completed",
                description: "Account funding via Flutterwave",
                reference: transactionId,
              },
              ...(userData.transactions || []),
            ],
          })

          // Add to transactions collection
          await addDoc(collection(db, "transactions"), {
            userId: user.uid,
            type: "deposit",
            amount: amount,
            status: "completed",
            description: "Account funding via Flutterwave",
            reference: transactionId,
            timestamp: serverTimestamp(),
          })

          setSuccess(`Successfully funded account with ₦${amount.toLocaleString()}`)
          setAmount("")

          if (onSuccess) {
            onSuccess(amount)
          }
        }
      } else {
        setError("Payment verification failed. Please contact support.")
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
      setError("An error occurred while verifying your payment. Please contact support.")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Fund Your Account</CardTitle>
        <CardDescription>Add funds to your account using Flutterwave secure payment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
            />
            <p className="text-sm text-muted-foreground">Minimum funding amount: ₦1,000</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleFundAccount} disabled={loading || verifying || !amount} className="w-full">
          {loading || verifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {verifying ? "Verifying Payment..." : "Processing..."}
            </>
          ) : (
            "Fund Account"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

