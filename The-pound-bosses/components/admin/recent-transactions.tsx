"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Loader2, MoreHorizontal, CheckCircle, XCircle } from "lucide-react"

interface Transaction {
  id: string
  userId: string
  username: string
  type: string
  amount: number
  description: string
  timestamp: string
  status: string
}

export function RecentTransactions({ showAll = false }: { showAll?: boolean }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const transactionsQuery = query(
          collection(db, "transactions"),
          orderBy("timestamp", "desc"),
          showAll ? undefined : limit(5),
        )

        const transactionsSnapshot = await getDocs(transactionsQuery)
        const transactionsData = transactionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]

        setTransactions(transactionsData)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [showAll])

  const handleUpdateStatus = async (transactionId: string, newStatus: string) => {
    try {
      setIsUpdating(true)
      await updateDoc(doc(db, "transactions", transactionId), {
        status: newStatus,
      })

      // Update local state
      setTransactions((prevTransactions) =>
        prevTransactions.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, status: newStatus } : transaction,
        ),
      )
    } catch (error) {
      console.error("Error updating transaction status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
            Deposit
          </Badge>
        )
      case "withdrawal":
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
            Withdrawal
          </Badge>
        )
      case "reward":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
            Reward
          </Badge>
        )
      case "referral":
        return (
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600">
            Referral
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No transactions found.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">{transaction.username || transaction.userId}</TableCell>
            <TableCell>{getTypeBadge(transaction.type)}</TableCell>
            <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
            <TableCell>{new Date(transaction.timestamp).toLocaleDateString()}</TableCell>
            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {transaction.status === "pending" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(transaction.id, "completed")}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(transaction.id, "failed")}
                        disabled={isUpdating}
                      >
                        <XCircle className="mr-2 h-4 w-4 text-red-500" />
                        Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  {transaction.status !== "pending" && (
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(transaction.id, "pending")}
                      disabled={isUpdating}
                    >
                      Reset to Pending
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

