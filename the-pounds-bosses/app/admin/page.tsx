import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { AdminStats } from "@/components/admin/admin-stats"
import { RecentUsers } from "@/components/admin/recent-users"
import { RecentTransactions } from "@/components/admin/recent-transactions"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for Pounds Bosses",
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <AdminHeader heading="Admin Dashboard" text="Manage your platform">
        <div className="flex items-center gap-2">
          <CalendarDateRangePicker />
        </div>
      </AdminHeader>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <AdminStats />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Recently registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentUsers />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Recent platform transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage all users on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentUsers showAll />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>View and manage all transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTransactions showAll />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  )
}

