"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Pencil, Trash } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Task = {
  id: string
  title: string
  description: string
  reward: number
  isCompulsory: boolean
  action: string
  actionPath: string
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // New task form state
  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    reward: 0,
    isCompulsory: false,
    action: "complete",
    actionPath: "",
  })

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasksDoc = await getDoc(doc(db, "tasks", "default"))

        if (tasksDoc.exists()) {
          const tasksData = tasksDoc.data().tasks as Task[]
          setTasks(tasksData)
        } else {
          // Create default tasks document if it doesn't exist
          await setDoc(doc(db, "tasks", "default"), { tasks: [] })
          setTasks([])
        }
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setError("Failed to load tasks. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.description) {
      setError("Title and description are required")
      return
    }

    if (newTask.reward <= 0) {
      setError("Reward must be greater than 0")
      return
    }

    try {
      setSaving(true)
      setError("")

      // Generate a unique ID for the task
      const taskId = `task_${Date.now()}`

      const updatedTasks = editingTask
        ? tasks.map((task) => (task.id === editingTask.id ? { ...newTask, id: editingTask.id } : task))
        : [...tasks, { ...newTask, id: taskId }]

      // Save to Firestore
      await setDoc(doc(db, "tasks", "default"), {
        tasks: updatedTasks,
      })

      // Update local state
      setTasks(updatedTasks)
      setSuccess(editingTask ? "Task updated successfully" : "Task added successfully")

      // Reset form
      setNewTask({
        title: "",
        description: "",
        reward: 0,
        isCompulsory: false,
        action: "complete",
        actionPath: "",
      })
      setEditingTask(null)
      setIsDialogOpen(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error saving task:", error)
      setError("Failed to save task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description,
      reward: task.reward,
      isCompulsory: task.isCompulsory,
      action: task.action,
      actionPath: task.actionPath,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return
    }

    try {
      setSaving(true)

      const updatedTasks = tasks.filter((task) => task.id !== taskId)

      // Save to Firestore
      await setDoc(doc(db, "tasks", "default"), {
        tasks: updatedTasks,
      })

      // Update local state
      setTasks(updatedTasks)
      setSuccess("Task deleted successfully")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error deleting task:", error)
      setError("Failed to delete task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-500/10 text-green-600">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTask(null)
                setNewTask({
                  title: "",
                  description: "",
                  reward: 0,
                  isCompulsory: false,
                  action: "complete",
                  actionPath: "",
                })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Update the task details below" : "Create a new task for users to complete"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reward">Reward (₦)</Label>
                <Input
                  id="reward"
                  type="number"
                  value={newTask.reward}
                  onChange={(e) => setNewTask({ ...newTask, reward: Number(e.target.value) })}
                  placeholder="Reward amount"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="action">Action Type</Label>
                <Select value={newTask.action} onValueChange={(value) => setNewTask({ ...newTask, action: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete">Complete (Button Click)</SelectItem>
                    <SelectItem value="navigate">Navigate (Redirect)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newTask.action === "navigate" && (
                <div className="grid gap-2">
                  <Label htmlFor="actionPath">Action Path</Label>
                  <Input
                    id="actionPath"
                    value={newTask.actionPath}
                    onChange={(e) => setNewTask({ ...newTask, actionPath: e.target.value })}
                    placeholder="/path/to/redirect"
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isCompulsory"
                  checked={newTask.isCompulsory}
                  onCheckedChange={(checked) => setNewTask({ ...newTask, isCompulsory: checked })}
                />
                <Label htmlFor="isCompulsory">Mark as compulsory task</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingTask ? (
                  "Update Task"
                ) : (
                  "Add Task"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No tasks created yet. Click "Add Task" to create your first task.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {task.title}
                    {task.isCompulsory && (
                      <Badge variant="destructive" className="ml-2">
                        Required
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{task.description}</TableCell>
                <TableCell>₦{task.reward.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="outline">{task.action === "complete" ? "Complete" : "Navigate"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

