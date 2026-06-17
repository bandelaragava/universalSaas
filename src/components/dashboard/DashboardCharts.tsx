import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/auth/usePermissions'
import { getFunnelStats } from '@/services/marketing'

const chartTooltipStyle = {
  contentStyle: {
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-card)',
  },
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function DashboardCharts() {
  const navigate = useNavigate()
  const { hasAnyPermission } = usePermissions()
  const canViewRevenue = hasAnyPermission(['REVENUE_VIEW_REVENUE', 'REVENUE_MANAGE_REVENUE_REVENUE', 'REPORTS_VIEW_REPORTS'])
  const canViewPipeline = hasAnyPermission(['LEADS_VIEW_LEADS', 'LEADS_VIEW_LEADS', 'REPORTS_VIEW_REPORTS'])
  const canViewReports = hasAnyPermission(['REPORTS_VIEW_REPORTS', 'REPORTS_VIEW_REPORTS'])

  // State to hold actual API data instead of mock-data
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        const [funnelRes] = await Promise.allSettled([
          getFunnelStats()
        ])
        
        if (!mounted) return
        
        if (funnelRes.status === 'fulfilled' && funnelRes.value) {
          if (Array.isArray(funnelRes.value)) {
            setFunnelData(funnelRes.value)
          } else if (typeof funnelRes.value === 'object') {
            const mapped = Object.entries(funnelRes.value).map(([key, value]) => ({
              stage: key.charAt(0).toUpperCase() + key.slice(1),
              count: Number(value) || 0
            }))
            setFunnelData(mapped)
          }
        }
        
        // Monthly revenue history endpoint does not exist yet. 
        // Using empty array to remove dummy data.
        setRevenueData([])
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    // Only fetch if they have permission
    if (canViewRevenue || canViewPipeline) {
      fetchData()
    } else {
      setLoading(false)
    }

    return () => { mounted = false }
  }, [canViewRevenue, canViewPipeline])

  if (!canViewRevenue && !canViewPipeline) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Key metrics</h3>
          <p className="text-sm text-muted-foreground">
            Revenue and pipeline at a glance. Detailed analytics live in Reports.
          </p>
        </div>
        {canViewReports && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => navigate('/reports')}
          >
            <BarChart3 className="h-4 w-4" />
            All reports
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-card/50">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {canViewRevenue && (
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Monthly Revenue"
                description="Total revenue by month"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `Rs.${(Number(v) / 100000).toFixed(0)}L`}
                    />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Revenue Growth"
                description="Month-over-month growth %"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip {...chartTooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="growth"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {canViewPipeline && (
            <ChartCard
              title="Leads Funnel"
              description="Pipeline from visitors to won deals"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="stage" type="category" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </>
      )}
    </div>
  )
}
