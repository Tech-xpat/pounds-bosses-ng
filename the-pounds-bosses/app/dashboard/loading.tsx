export default function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  )
}

