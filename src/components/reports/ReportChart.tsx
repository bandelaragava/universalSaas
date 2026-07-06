import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartType } from '@/types/reports'
import type { BreakdownPoint, MonthlyTrendPoint } from '@/types/reports'
import { formatCurrency } from '@/lib/utils'

const tooltipStyle = {
  contentStyle: {
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-card)',
  },
}

interface TrendChartProps {
  chartType: ChartType
  data: MonthlyTrendPoint[]
  dataKey: 'users' | 'revenue' | 'newUsers'
  color?: string
  height?: number
}

export function ReportTrendChart({
  chartType,
  data,
  dataKey,
  color = '#6366f1',
  height = 280,
}: TrendChartProps) {
  if (chartType === 'none') return null

  const formatter =
    dataKey === 'revenue'
      ? (v: number | string) => formatCurrency(Number(v))
      : (v: number | string) => Number(v).toLocaleString()

  if (chartType === 'pie') {
    const pieData = data.map((d) => ({
      name: d.label,
      value: d[dataKey] as number,
    }))
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
            {pieData.map((_, i) => (
              <Cell key={i} fill={['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][i % 6]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v) => formatter(v as number)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={dataKey === 'revenue' ? (v) => `₹${(v / 100000).toFixed(0)}L` : undefined} />
          <Tooltip {...tooltipStyle} formatter={(v) => formatter(v as number)} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip {...tooltipStyle} formatter={(v) => formatter(v as number)} />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={dataKey === 'revenue' ? (v) => `₹${(Number(v) / 100000).toFixed(0)}L` : undefined} />
        <Tooltip {...tooltipStyle} formatter={(v) => formatter(v as number)} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface BreakdownChartProps {
  chartType: ChartType
  data: BreakdownPoint[]
  height?: number
}

export function ReportBreakdownChart({ chartType, data, height = 280 }: BreakdownChartProps) {
  if (chartType === 'none') return null

  if (chartType === 'pie' || chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={chartType === 'pie' ? 0 : 50} outerRadius={90} label>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={chartType === 'bar' ? 'vertical' : undefined}>
        <CartesianGrid strokeDasharray="3 3" />
        {chartType === 'bar' ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
          </>
        )}
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

interface CombinedChartProps {
  chartType: ChartType
  data: MonthlyTrendPoint[]
  showUsers: boolean
  showRevenue: boolean
  height?: number
}

export function ReportCombinedChart({
  chartType,
  data,
  showUsers,
  showRevenue,
  height = 300,
}: CombinedChartProps) {
  if (chartType === 'none' || (!showUsers && !showRevenue)) return null

  const normalized = data.map((d) => ({
    ...d,
    revenueL: d.revenue / 100000,
    usersK: d.users / 100,
  }))

  if (chartType === 'pie') {
    const pieData = []
    if (showUsers) pieData.push({ name: 'Total Users', value: data[data.length - 1]?.users ?? 0, color: '#6366f1' })
    if (showRevenue) pieData.push({ name: 'Total Revenue', value: data.reduce((s, d) => s + d.revenue, 0) / 100000, color: '#10b981' })
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
            {pieData.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={normalized}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip {...tooltipStyle} />
          <Legend />
          {showUsers && <Line yAxisId="left" type="monotone" dataKey="users" name="Users" stroke="#6366f1" strokeWidth={2} />}
          {showRevenue && <Line yAxisId="right" type="monotone" dataKey="revenueL" name="Revenue (₹L)" stroke="#10b981" strokeWidth={2} />}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={normalized}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip {...tooltipStyle} />
          <Legend />
          {showUsers && <Area type="monotone" dataKey="users" name="Users" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />}
          {showRevenue && <Area type="monotone" dataKey="revenueL" name="Revenue (₹L)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={normalized}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip {...tooltipStyle} />
        <Legend />
        {showUsers && <Bar dataKey="users" name="Users" fill="#6366f1" radius={[4, 4, 0, 0]} />}
        {showRevenue && <Bar dataKey="revenueL" name="Revenue (₹L)" fill="#10b981" radius={[4, 4, 0, 0]} />}
      </BarChart>
    </ResponsiveContainer>
  )
}




