"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MoreHorizontal } from "lucide-react"

interface User {
  id: string
  email: string
  username: string
  createdAt: string
  lastLogin: string
  isVerified: boolean
  isAdmin: boolean
  isBlocked: boolean
}

export function RecentUsers({ showAll = false }: { showAll?: boolean }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), showAll ? undefined : limit(5))

        const usersSnapshot = await getDocs(usersQuery)
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isVerified: doc.data().emailVerified || false,
          isAdmin: doc.data().isAdmin || false,
          isBlocked: doc.data().isBlocked || false,
        })) as User[]

        setUsers(usersData)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [showAll])

  const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    try {
      setIsUpdating(true)
      await updateDoc(doc(db, "users", userId), {
        isAdmin: makeAdmin,
      })

      // Update local state
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, isAdmin: makeAdmin } : user)))
    } catch (error) {
      console.error("Error updating user admin status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleBlock = async (userId: string, block: boolean) => {
    try {
      setIsUpdating(true)
      await updateDoc(doc(db, "users", userId), {
        isBlocked: block,
      })

      // Update local state
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, isBlocked: block } : user)))
    } catch (error) {
      console.error("Error updating user block status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (users.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No users found.</div>
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.username ? user.username.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {user.isAdmin && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      Admin
                    </span>
                  )}
                  {user.isBlocked && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                      Blocked
                    </span>
                  )}
                  {!user.isAdmin && !user.isBlocked && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Active
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</TableCell>
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
                    <DropdownMenuItem onClick={() => setSelectedUser(user)}>View Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, !user.isAdmin)}>
                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleBlock(user.id, !user.isBlocked)}>
                      {user.isBlocked ? "Unblock User" : "Block User"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Detailed information about {selectedUser.username}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Username</Label>
                <Input value={selectedUser.username} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Email</Label>
                <Input value={selectedUser.email} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Created</Label>
                <Input value={new Date(selectedUser.createdAt).toLocaleString()} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Last Login</Label>
                <Input
                  value={selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : "Never"}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3 flex gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${selectedUser.isAdmin ? "bg-blue-50 text-blue-700 ring-blue-600/20" : "bg-gray-50 text-gray-700 ring-gray-600/20"} ring-1 ring-inset`}
                  >
                    {selectedUser.isAdmin ? "Admin" : "User"}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${selectedUser.isBlocked ? "bg-red-50 text-red-700 ring-red-600/20" : "bg-green-50 text-green-700 ring-green-600/20"} ring-1 ring-inset`}
                  >
                    {selectedUser.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

