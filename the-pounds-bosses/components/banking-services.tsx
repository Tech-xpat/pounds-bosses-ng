"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Wallet, ArrowDownCircle, CreditCard, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FundAccount } from "@/components/fund-account"
import { BankAccountValidator } from "@/components/bank-account-validator"
import { TransactionPin } from "@/components/transaction-pin"

interface BankAccount {
  id: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
}

interface TransactionHistory {
  id: string
  type: "deposit" | "withdrawal"
  amount: number
  date: string
  status: "pending" | "completed" | "failed"
  description: string
  reference?: string
}

export function BankingServices() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<TransactionHistory[]>([])
  const [balance, setBalance] = useState({
    totalEarnings: 0,
    availableForWithdrawal: 0,
    pendingEarnings: 0,
    bonusEarnings: 0,
  })
  const [newAccount, setNewAccount] = useState<BankAccount | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("fund")
  const [hasTransactionPin, setHasTransactionPin] = useState(false)
  const [transactionPin, setTransactionPin] = useState("")
  const [addingAccount, setAddingAccount] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    const fetchUserData = async () => {
      setLoading(true)
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setBankAccounts(userData.bankAccounts || [])
          setTransactions(userData.transactions || [])
          setBalance({
            totalEarnings: userData.totalEarnings || 0,
            availableForWithdrawal: userData.availableForWithdrawal || 0,
            pendingEarnings: userData.pendingEarnings || 0,
            bonusEarnings: userData.bonusEarnings || 0,
          })
          setHasTransactionPin(!!userData.transactionPin)
          setTransactionPin(userData.transactionPin || "")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const handleBankValidation = (isValid: boolean, data: any) => {
    if (isValid && data.accountName && data.accountName.trim() !== "") {
      setNewAccount({
        id: crypto.randomUUID(),
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      })
      setError("") // Clear any previous errors
    } else {
      setNewAccount(null)
      if (data.accountNumber && data.bankName) {
        setError("Account name verification failed. Please check the account details.")
      }
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount) {
      setError("Please validate a bank account first")
      return
    }

    setError("")
    setSuccess("")
    setAddingAccount(true)

    try {
      // Check if account already exists
      const accountExists = bankAccounts.some(
        (account) => account.accountNumber === newAccount.accountNumber && account.bankCode === newAccount.bankCode,
      )

      if (accountExists) {
        setError("This bank account is already saved")
        setAddingAccount(false)
        return
      }

      const updatedAccounts = [...bankAccounts, newAccount]
      await updateDoc(doc(db, "users", user.uid), {
        bankAccounts: updatedAccounts,
      })
      setBankAccounts(updatedAccounts)
      setNewAccount(null)
      setSuccess("Bank account added successfully")
    } catch (error) {
      setError("Failed to add bank account")
      console.error("Error adding bank account:", error)
    } finally {
      setAddingAccount(false)
    }
  }

  const handleDeleteAccount = async (account: BankAccount) => {
    try {
      // Remove the account from the array
      const updatedAccounts = bankAccounts.filter((acc) => acc.id !== account.id)

      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        bankAccounts: updatedAccounts,
      })

      // Update local state
      setBankAccounts(updatedAccounts)
      return true
    } catch (error) {
      console.error("Error deleting account:", error)
      throw error
    }
  }

  const handleFundingSuccess = (amount: number) => {
    // Update local state to reflect the new balance
    setBalance((prev) => ({
      ...prev,
      availableForWithdrawal: prev.availableForWithdrawal + amount,
      totalEarnings: prev.totalEarnings + amount,
    }))

    // Refresh transactions
    if (user?.uid) {
      getDoc(doc(db, "users", user.uid)).then((userDoc) => {
        if (userDoc.exists()) {
          setTransactions(userDoc.data().transactions || [])
        }
      })
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="skeleton h-8 w-1/3"></CardTitle>
          <CardDescription className="skeleton h-4 w-1/2"></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="skeleton h-20 w-full"></div>
            <div className="skeleton h-40 w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-primary" />
            Banking Services
          </CardTitle>
          <CardDescription>Manage your earnings and bank accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{balance.totalEarnings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Lifetime earnings</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available for Withdrawal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₦{balance.availableForWithdrawal.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Ready to withdraw</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bonus Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₦{balance.bonusEarnings?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">From referral links</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">₦{balance.pendingEarnings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Processing</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fund">Fund Account</TabsTrigger>
              <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
              <TabsTrigger value="history">Transactions</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="fund" className="space-y-4 pt-4">
              <FundAccount onSuccess={handleFundingSuccess} />
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4 pt-4">
              <div className="space-y-6">
                <BankAccountValidator
                  onValidation={handleBankValidation}
                  savedAccounts={bankAccounts}
                  onDeleteAccount={handleDeleteAccount}
                  userPin={transactionPin}
                />

                {newAccount && (
                  <div className="mt-4">
                    <Button onClick={handleAddAccount} disabled={addingAccount} className="w-full">
                      {addingAccount ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Account...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Save Bank Account
                        </>
                      )}
                    </Button>
                  </div>
                )}

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
            </TabsContent>

            <TabsContent value="history" className="space-y-4 pt-4">
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {transaction.type === "deposit" ? (
                              <ArrowDownCircle className="mr-2 h-5 w-5 text-green-500" />
                            ) : (
                              <ArrowDownCircle className="mr-2 h-5 w-5 text-blue-500" />
                            )}
                            <div>
                              <p className="font-medium">{transaction.type === "deposit" ? "Deposit" : "Withdrawal"}</p>
                              <p className="text-sm text-muted-foreground">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString("en-NG", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${transaction.type === "deposit" ? "text-green-600" : ""}`}>
                              {transaction.type === "deposit" ? "+" : "-"}₦{transaction.amount.toLocaleString()}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                transaction.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No transactions</AlertTitle>
                  <AlertDescription>Your transaction history will appear here</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-4 pt-4">
              <TransactionPin />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Funding via Flutterwave is secure and instant. To request a withdrawal, please add a bank account and
            contact support.
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

