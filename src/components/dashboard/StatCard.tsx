import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { StatWidget } from '@/types'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

const statRoutes: Record<string, string> = {
  users: '/users',
  leads: '/leads',
  revenue: '/revenue',
  attendance: '/attendance',
  tasks: '/tasks',
  tickets: '/tickets',
  followups: '/leads/followups',
  payroll: '/payroll',
  'today-followups': '/leads/followups',
  'pending-followups': '/leads/followups',
  'today-revenue': '/revenue',
  'pending-revenue': '/revenue',
  'today-tasks': '/tasks',
  'pending-tasks': '/tasks',
  'pending-tickets': '/tickets',
}

interface StatCardProps {
  stat: StatWidget
  index: number
}

export function StatCard({ stat, index }: StatCardProps) {
  const navigate = useNavigate()
  const { info } = useToast()
  const Icon = stat.icon
  const isUp = stat.trend === 'up'
  const route = statRoutes[stat.id]

  const handleClick = () => {
    if (route) {
      info(`Opening ${stat.title}`, 'Viewing detailed module…')
      navigate(route)
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'relative w-full overflow-hidden rounded-xl p-5 text-left text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        `bg-gradient-to-br ${stat.gradient}`
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{stat.title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{stat.value}</p>
          {stat.change !== 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium">
              {isUp ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{Math.abs(stat.change)}% vs last month</span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-white/20 p-2.5 backdrop-blur-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.button>
  )
}


