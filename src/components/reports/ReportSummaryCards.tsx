import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp, Users, IndianRupee, UserPlus, Wallet } from 'lucide-react'
import type { ReportSummary } from '@/types/reports'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ReportSummaryCardsProps {
  summary: ReportSummary
  showUsers: boolean
  showRevenue: boolean
}

export function ReportSummaryCards({ summary, showUsers, showRevenue }: ReportSummaryCardsProps) {
  const cards = [
    ...(showUsers
      ? [
          {
            label: 'Total Users',
            value: summary.totalUsers.toLocaleString(),
            sub: `${summary.activeUsers.toLocaleString()} active`,
            change: summary.userGrowthPercent,
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600',
          },
          {
            label: 'New Users (range)',
            value: summary.newUsersInRange.toLocaleString(),
            sub: 'In selected period',
            change: summary.userGrowthPercent,
            icon: UserPlus,
            gradient: 'from-violet-500 to-purple-600',
          },
        ]
      : []),
    ...(showRevenue
      ? [
          {
            label: 'Total Revenue',
            value: formatCurrency(summary.totalRevenue),
            sub: 'In selected period',
            change: summary.revenueGrowthPercent,
            icon: IndianRupee,
            gradient: 'from-emerald-500 to-teal-600',
          },
          {
            label: 'Avg Revenue / User',
            value: formatCurrency(summary.avgRevenuePerUser),
            sub: 'Per month avg',
            change: summary.revenueGrowthPercent,
            icon: Wallet,
            gradient: 'from-amber-500 to-orange-600',
          },
        ]
      : []),
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon
        const isUp = card.change >= 0
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'rounded-xl p-5 text-white shadow-lg bg-gradient-to-br',
              card.gradient
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/80">{card.label}</p>
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
                <p className="mt-1 text-xs text-white/70">{card.sub}</p>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium">
                  {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(card.change).toFixed(1)}% vs prior period
                </div>
              </div>
              <div className="rounded-lg bg-white/20 p-2">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}




