import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskManager } from "@/components/admin/task-manager"

export const metadata: Metadata = {
  title: "Admin Tasks",
  description: "Manage tasks for users",
}

export default function AdminTasksPage() {
  return (
    <AdminShell>
      <AdminHeader heading="Task Management" text="Create and manage tasks for users"></AdminHeader>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Create and manage tasks that users can complete to earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskManager />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}

