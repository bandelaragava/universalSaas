import type {
  BreakdownPoint,
  GeneratedReport,
  MonthlyTrendPoint,
  ReportDisplayConfig,
  ReportSummary,
} from '@/types/reports'

export const DEFAULT_REPORT_DISPLAY_CONFIG: ReportDisplayConfig = {
  usersTrend: { enabled: true, chartType: 'bar' },
  revenueTrend: { enabled: true, chartType: 'line' },
  usersByRole: { enabled: true, chartType: 'pie' },
  revenueBySource: { enabled: true, chartType: 'pie' },
  usersVsRevenue: { enabled: true, chartType: 'area' },
}

export const REPORT_DISPLAY_STORAGE_KEY = 'universal-report-display-config'

export const monthlyTrendData: MonthlyTrendPoint[] = []

export const usersByRole: BreakdownPoint[] = []

export const revenueBySource: BreakdownPoint[] = []

export const generatedReportsSeed: GeneratedReport[] = []

export function computeReportSummary(
  trend: MonthlyTrendPoint[],
  dateFrom: string,
  dateTo: string
): ReportSummary {
  const filtered = trend.filter((p) => p.month >= dateFrom.slice(0, 7) && p.month <= dateTo.slice(0, 7))
  const data = filtered.length > 0 ? filtered : trend

  if (data.length === 0) {
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersInRange: 0,
      totalRevenue: 0,
      avgRevenuePerUser: 0,
      userGrowthPercent: 0,
      revenueGrowthPercent: 0,
    }
  }

  const latest = data[data.length - 1]
  const previous = data.length > 1 ? data[data.length - 2] : latest

  const totalRevenue = data.reduce((sum, p) => sum + p.revenue, 0)
  const newUsersInRange = data.reduce((sum, p) => sum + p.newUsers, 0)

  const userGrowthPercent =
    previous.users > 0 ? ((latest.users - previous.users) / previous.users) * 100 : 0
  const revenueGrowthPercent =
    previous.revenue > 0 ? ((latest.revenue - previous.revenue) / previous.revenue) * 100 : 0

  return {
    totalUsers: latest.users,
    activeUsers: Math.round(latest.users * 0.87),
    newUsersInRange,
    totalRevenue,
    avgRevenuePerUser: latest.users > 0 ? Math.round(totalRevenue / data.length / latest.users) : 0,
    userGrowthPercent,
    revenueGrowthPercent,
  }
}

export const chartTypeOptions = [
  { value: 'bar' as const, label: 'Bar Chart' },
  { value: 'line' as const, label: 'Line Chart' },
  { value: 'pie' as const, label: 'Pie Chart' },
  { value: 'area' as const, label: 'Area Chart' },
  { value: 'none' as const, label: 'Hidden' },
]

export const visualizationLabels: Record<keyof ReportDisplayConfig, string> = {
  usersTrend: 'Users Over Time',
  revenueTrend: 'Revenue Over Time',
  usersByRole: 'Users by Role',
  revenueBySource: 'Revenue by Source',
  usersVsRevenue: 'Users vs Revenue Comparison',
}


