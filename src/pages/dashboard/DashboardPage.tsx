import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { WelcomeSection } from '@/components/dashboard/WelcomeSection'
import { StatCard } from '@/components/dashboard/StatCard'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline'
import { usePermissions } from '@/auth/usePermissions'

export function DashboardPage() {
  const { stats, activities, loading } = useDashboard()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const canViewCharts = hasAnyPermission(['REPORTS_VIEW_REPORTS', 'REVENUE_VIEW_REVENUE', 'LEADS_VIEW_LEADS', 'LEADS_VIEW_LEADS'])

  const canViewAttendance = hasPermission('ATTENDANCE_VIEW_ATTENDANCE')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WelcomeSection />

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Top KPIs - click a card to open the related module.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats && stats.length > 0 ? (
            stats.map((stat, i) => (
              <StatCard key={stat.id} stat={stat} index={i} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No dashboard statistics available.</p>
          )}
        </div>
      </div>

      {canViewCharts && <DashboardCharts />}

      {activities.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <ActivityTimeline activities={activities} />
          </div>
        </div>
      )}

      {!canViewCharts && canViewAttendance && (
        <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
          Your access is limited to attendance.{' '}
          <Link to="/attendance" className="font-semibold text-primary underline">
            Open Attendance
          </Link>
        </div>
      )}
    </div>
  )
}

export default DashboardPage


