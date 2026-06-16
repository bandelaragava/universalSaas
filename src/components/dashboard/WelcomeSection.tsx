import { motion } from 'framer-motion'
import { Building2, GitBranch, Shield, RefreshCw } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function WelcomeSection() {
  const { tenant } = useApp()
  const { success, info } = useToast()

  const handleRefresh = () => {
    info('Refreshing dashboard', 'Loading latest metrics…')
    setTimeout(() => {
      success('Dashboard updated', 'All widgets refreshed with latest data.')
    }, 800)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{formatDate()}</p>
              <h2 className="mt-1 text-2xl font-bold lg:text-3xl">
                Welcome back, {tenant.userName.split(' ')[0]} 👋
              </h2>

            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 p-2 sm:px-4 sm:py-3 backdrop-blur-sm min-w-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-white/70">Role</p>
                  <p className="text-xs sm:text-sm font-semibold truncate">{tenant.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 p-2 sm:px-4 sm:py-3 backdrop-blur-sm min-w-0">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-white/70">Company</p>
                  <p className="text-xs sm:text-sm font-semibold truncate">{tenant.companyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 p-2 sm:px-4 sm:py-3 backdrop-blur-sm min-w-0">
                <GitBranch className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-white/70">Branch</p>
                  <p className="text-xs sm:text-sm font-semibold truncate">{tenant.branchName}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


