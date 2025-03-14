"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  timestamp: any
}

export function RecentTransactions({ showAll = false }: { showAll?: boolean }) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      if (!user) return

      try {
        const transactionsRef = collection(db, "transactions")
        const q = query(
          transactionsRef,
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(showAll ? 50 : 5),
        )

        const querySnapshot = await getDocs(q)
        const transactionsList: Transaction[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          transactionsList.push({
            id: doc.id,
            type: data.type,
            amount: data.amount,
            status: data.status,
            description: data.description,
            timestamp: data.timestamp?.toDate(),
          })
        })

        setTransactions(transactionsList)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching transactions:", error)
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user, showAll])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(showAll ? 10 : 5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <Skeleton className="h-4 w-[100px]" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {transaction.description || getTransactionDescription(transaction.type)}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : "Unknown date"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${transaction.type === "deposit" || transaction.type === "referral" ? "text-green-500" : "text-red-500"}`}
            >
              {transaction.type === "deposit" || transaction.type === "referral" ? "+" : "-"}₦
              {transaction.amount.toLocaleString()}
            </span>
            <StatusBadge status={transaction.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Completed
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Pending
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Failed
        </Badge>
      )
    default:
      return null
  }
}

function getTransactionDescription(type: string): string {
  switch (type) {
    case "deposit":
      return "Account Deposit"
    case "withdrawal":
      return "Withdrawal"
    case "referral":
      return "Referral Bonus"
    case "task":
      return "Task Completion"
    case "interest":
      return "Daily Interest"
    default:
      return "Transaction"
  }
}

