import { Outlet, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/AuthContext'
import { usePermissions } from '@/auth/usePermissions'
import { menuConfig } from '@/config/navigation'
import { QuickActionDialogs } from '@/components/dashboard/QuickActionDialogs'

export function AppLayout() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useApp()
  const { permissions, loading } = useAuth()
  const permission = usePermissions()

  const safeCan = (item: typeof menuConfig[number]['items'][number]) => {
    if (item.id === 'dashboard') return true
    if (permissions?.includes('*')) return true

    const permissionPassed = item.permission
      ? permission.can(item.permission)
      : false

    const permissionsPassed =
      item.permissions && item.permissions.length > 0
        ? permission.canAny(item.permissions)
        : false

    return permissionPassed || permissionsPassed
  }

  const filteredMenu = menuConfig
    .map((section) => {
      const filteredItems = section.items.filter(safeCan)
      if (filteredItems.length === 0) return null
      return { ...section, items: filteredItems }
    })
    .filter((section): section is typeof menuConfig[number] => section !== null)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-card shadow-xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b px-4">
                <span className="font-bold">Universal SaaS</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 space-y-4 overflow-y-auto p-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-primary" />
                  </div>
                ) : (
                  filteredMenu.map((section) => (
                    <div key={section.id}>
                      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.label}
                      </p>

                      <ul className="space-y-0.5">
                        {section.items.map((item) => (
                          <li key={item.id}>
                            <NavLink
                              to={item.path}
                              end={item.path === '/'}
                              onClick={() => setMobileSidebarOpen(false)}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                  isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )
                              }
                            >
                              <item.icon className="h-5 w-5 shrink-0" />
                              <span className="flex-1 truncate">
                                {item.label}
                              </span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        )}
      >
        <Header />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <QuickActionDialogs />
    </div>
  )
}