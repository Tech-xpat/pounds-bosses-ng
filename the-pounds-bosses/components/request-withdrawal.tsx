"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, CheckCircle, ArrowUpCircle, Lock } from "lucide-react"

interface RequestWithdrawalProps {
  className?: string
}

export function RequestWithdrawal({ className }: RequestWithdrawalProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [withdrawalBank, setWithdrawalBank] = useState("")
  const [withdrawalPin, setWithdrawalPin] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showPinInput, setShowPinInput] = useState(false)
  const [validatingPin, setValidatingPin] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [balance, setBalance] = useState({
    availableForWithdrawal: 0,
  })
  const [hasTransactionPin, setHasTransactionPin] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")

  useEffect(() => {
    if (user?.uid) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setBankAccounts(userData.bankAccounts || [])
        setBalance({
          availableForWithdrawal: userData.availableForWithdrawal || 0,
        })
        setHasTransactionPin(!!userData.transactionPin)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Failed to load your account data. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawalRequest = () => {
    setError("")

    if (!withdrawalAmount || !withdrawalBank) {
      setError("Please fill in all fields")
      return
    }

    const amount = Number.parseFloat(withdrawalAmount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (amount > balance.availableForWithdrawal) {
      setError("Insufficient balance")
      return
    }

    if (amount < 1000) {
      setError("Minimum withdrawal amount is ₦1,000")
      return
    }

    // If user has a transaction PIN, show PIN input
    if (hasTransactionPin) {
      setShowPinInput(true)
    } else {
      // If no PIN is set, show error
      setError("You need to set up a transaction PIN before making withdrawals")
    }
  }

  const verifyTransactionPin = async () => {
    setValidatingPin(true)
    setError("")

    try {
      // Verify PIN against stored PIN
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()

        if (userData.transactionPin !== withdrawalPin) {
          setError("Invalid transaction PIN")
          setValidatingPin(false)
          return
        }

        // PIN is valid, proceed with withdrawal
        processWithdrawal(Number.parseFloat(amount))
      }
    } catch (error) {
      console.error("Error verifying PIN:", error)
      setError("An error occurred while verifying your PIN")
    } finally {
      setValidatingPin(false)
      setShowPinInput(false)
      setWithdrawalPin("")
    }
  }

  const processWithdrawal = async (amount: number) => {
    setProcessing(true)
    try {
      // Get selected bank account details
      const selectedBankInfo = withdrawalBank.split(" - ")
      const bankName = selectedBankInfo[0]
      const accountNumber = selectedBankInfo[1]

      // Find the full bank account details
      const bankAccount = bankAccounts.find((acc) => acc.bankName === bankName && acc.accountNumber === accountNumber)

      if (!bankAccount) {
        setError("Selected bank account not found")
        setProcessing(false)
        return
      }

      // Create withdrawal record in the withdrawals collection
      const withdrawalData = {
        userId: user.uid,
        amount,
        bankName: bankAccount.bankName,
        bankCode: bankAccount.bankCode,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        timestamp: new Date().toISOString(),
        status: "pending",
      }

      await addDoc(collection(db, "withdrawals"), withdrawalData)

      // Update user's available balance
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const transactions = userData.transactions || []

        // Create transaction record in user's transactions
        const newTransaction = {
          id: `w-${Date.now()}`,
          type: "withdrawal",
          amount,
          date: new Date().toISOString(),
          status: "pending",
          description: `Withdrawal to ${bankAccount.bankName} - ${bankAccount.accountNumber}`,
        }

        await updateDoc(userRef, {
          transactions: [newTransaction, ...transactions],
          availableForWithdrawal: balance.availableForWithdrawal - amount,
        })
      }

      setBalance({
        ...balance,
        availableForWithdrawal: balance.availableForWithdrawal - amount,
      })

      setAmount("")
      setWithdrawalBank("")
      setSuccess("Withdrawal request submitted successfully. Your request is pending admin approval.")
    } catch (error) {
      console.error("Error processing withdrawal:", error)
      setError("Failed to process withdrawal. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="skeleton h-6 w-1/3"></CardTitle>
          <CardDescription className="skeleton h-4 w-1/2"></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="skeleton h-10 w-full"></div>
            <div className="skeleton h-10 w-full"></div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="skeleton h-10 w-full"></div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
        <CardDescription>Request to withdraw funds to your bank account. Minimum withdrawal is ₦1,000.</CardDescription>
      </CardHeader>
      <CardContent>
        {showPinInput ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pin">Enter Transaction PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your 4-digit PIN"
                value={withdrawalPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  if (value.length <= 4) {
                    setWithdrawalPin(value)
                  }
                }}
                maxLength={4}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button onClick={() => setShowPinInput(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={verifyTransactionPin}
                disabled={withdrawalPin.length !== 4 || validatingPin}
                className="flex-1"
              >
                {validatingPin ? "Verifying..." : "Confirm Withdrawal"}
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleWithdrawalRequest()
            }}
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min="1000"
                  step="100"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum withdrawal: ₦1,000. Available: ₦{balance.availableForWithdrawal.toLocaleString()}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bank">Select Bank Account</Label>
                <Select value={withdrawalBank} onValueChange={setWithdrawalBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.length > 0 ? (
                      bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={`${account.bankName} - ${account.accountNumber}`}>
                          {account.bankName} - {account.accountNumber}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No bank accounts added
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
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

              {!hasTransactionPin && (
                <Alert className="bg-yellow-500/10 text-yellow-600">
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Transaction PIN Required</AlertTitle>
                  <AlertDescription>
                    You need to set up a transaction PIN before making withdrawals. Go to the Security tab to set up
                    your PIN.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button type="submit" className="w-full mt-4" disabled={bankAccounts.length === 0 || processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Request Withdrawal
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <p>Withdrawals are processed within 24-48 hours after admin approval. A transaction fee may apply.</p>
      </CardFooter>
    </Card>
  )
}

