"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  reward: number
  status: "pending" | "completed" | "expired"
  deadline: Date
  isCompulsory: boolean
}

export function TaskList() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      if (!user) return

      try {
        // Fetch user-specific tasks
        const userTasksRef = collection(db, "users", user.uid, "tasks")
        const userTasksQuery = query(userTasksRef, orderBy("deadline"))
        const userTasksSnapshot = await getDocs(userTasksQuery)

        // Fetch global tasks
        const globalTasksRef = collection(db, "tasks")
        const globalTasksQuery = query(globalTasksRef, where("isGlobal", "==", true), orderBy("deadline"))
        const globalTasksSnapshot = await getDocs(globalTasksQuery)

        const allTasks: Task[] = []

        // Process user-specific tasks
        userTasksSnapshot.forEach((doc) => {
          const data = doc.data()
          allTasks.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            reward: data.reward,
            status: data.status,
            deadline: data.deadline?.toDate(),
            isCompulsory: data.isCompulsory || false,
          })
        })

        // Process global tasks (only if not already in user tasks)
        globalTasksSnapshot.forEach((doc) => {
          // Check if this global task is already in user tasks
          const exists = allTasks.some((task) => task.id === doc.id)
          if (!exists) {
            const data = doc.data()
            allTasks.push({
              id: doc.id,
              title: data.title,
              description: data.description,
              reward: data.reward,
              status: "pending", // Default status for global tasks
              deadline: data.deadline?.toDate(),
              isCompulsory: data.isCompulsory || false,
            })
          }
        })

        // Sort tasks by deadline
        allTasks.sort((a, b) => {
          // Sort by status first (pending first)
          if (a.status === "pending" && b.status !== "pending") return -1
          if (a.status !== "pending" && b.status === "pending") return 1

          // Then sort by compulsory (compulsory first)
          if (a.isCompulsory && !b.isCompulsory) return -1
          if (!a.isCompulsory && b.isCompulsory) return 1

          // Then sort by deadline
          return a.deadline.getTime() - b.deadline.getTime()
        })

        setTasks(allTasks)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setLoading(false)
      }
    }

    fetchTasks()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-1/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Tasks Available</CardTitle>
          <CardDescription>You don't have any tasks at the moment</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Check back later for new tasks to complete.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const { user } = useAuth()
  const [completing, setCompleting] = useState(false)

  const isExpired = task.deadline < new Date() && task.status === "pending"
  const statusDisplay = isExpired ? "expired" : task.status

  async function completeTask() {
    if (!user) return

    setCompleting(true)
    try {
      // Update task status in Firestore
      // This is a placeholder - implement the actual completion logic
      console.log(`Completing task ${task.id}`)

      // In a real implementation, you would:
      // 1. Update the task status in Firestore
      // 2. Add the reward to the user's balance
      // 3. Create a transaction record

      setCompleting(false)
      // Refresh the page to show updated task status
      window.location.reload()
    } catch (error) {
      console.error("Error completing task:", error)
      setCompleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              {task.title}
              {task.isCompulsory && (
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                  Required
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Due: {task.deadline.toLocaleDateString()} at {task.deadline.toLocaleTimeString()}
            </CardDescription>
          </div>
          <TaskStatusBadge status={statusDisplay} />
        </div>
      </CardHeader>
      <CardContent>
        <p>{task.description}</p>
        <p className="mt-2 font-medium">Reward: ₦{task.reward.toLocaleString()}</p>
      </CardContent>
      <CardFooter>
        {task.status === "pending" && !isExpired ? (
          <Button onClick={completeTask} disabled={completing}>
            {completing ? "Completing..." : "Complete Task"}
          </Button>
        ) : (
          <Button variant="outline" disabled>
            {task.status === "completed" ? "Completed" : "Expired"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function TaskStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="mr-1 h-4 w-4" />
          <span className="text-sm font-medium">Completed</span>
        </div>
      )
    case "pending":
      return (
        <div className="flex items-center text-yellow-600">
          <Clock className="mr-1 h-4 w-4" />
          <span className="text-sm font-medium">Pending</span>
        </div>
      )
    case "expired":
      return (
        <div className="flex items-center text-red-600">
          <AlertCircle className="mr-1 h-4 w-4" />
          <span className="text-sm font-medium">Expired</span>
        </div>
      )
    default:
      return null
  }
}

