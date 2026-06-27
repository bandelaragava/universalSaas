import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/auth/AuthContext'
import { usePermissions } from '@/auth/usePermissions'
import { menuConfig } from '@/config/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MenuItem = (typeof menuConfig)[number]['items'][number]

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()
  const auth = useAuth()
  const permission = usePermissions()

  const userPermissions = auth.permissions || []

  if (auth.loading) {
    return (
      <div className="flex h-screen w-64 items-center justify-center border-r border-border bg-card">
        <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-primary" />
      </div>
    )
  }

  const canShowItem = (item: MenuItem) => {
    if (item.id === 'dashboard') return true
    if (userPermissions.includes('*') || auth.isPlatformAdmin) return true

    if (item.requiredModules && item.requiredModules.length > 0) {
      const hasRequiredModule = item.requiredModules.some(mod => permission.isModuleEnabled(mod));
      if (!hasRequiredModule) return false;
    }

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
      // Completely hide the 'platform' section for regular tenants
      if (section.id === 'platform' && auth.user?.tenantCode !== 'SYS') {
        return null;
      }
      const items = section.items.filter(canShowItem)
      if (items.length === 0) return null
      return { ...section, items }
    })
    .filter(Boolean) as typeof menuConfig

  // Debug visibility
  const settingsItem = menuConfig.flatMap(s => s.items).find(i => i.id === 'settings');
  const integrationsItem = menuConfig.flatMap(s => s.items).find(i => i.id === 'integrations');

  if (settingsItem && canShowItem(settingsItem)) {
    const matchedPerms = settingsItem.permissions?.filter(p => permission.can(p)) || [];
    console.log("Settings is visible due to permissions:", matchedPerms);
  }
  if (integrationsItem && canShowItem(integrationsItem)) {
    const matchedPerms = integrationsItem.permissions?.filter(p => permission.can(p)) || [];
    console.log("Integrations is visible due to permissions:", matchedPerms);
  }

  console.log("SIDEBAR DEBUG", {
    permissions: auth.permissions,
    modules: auth.modules,
    filteredMenu
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-card transition-all duration-300 lg:flex',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
          <Layers className="h-5 w-5" />
        </div>

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="whitespace-nowrap text-sm font-bold tracking-tight">
                Universal SaaS
              </span>
              <p className="text-[10px] text-muted-foreground">
                Enterprise Platform
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-4">
          {filteredMenu.map((section) => (
            <div key={section.id}>
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}

              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg bg-primary/10"
                              transition={{
                                type: 'spring',
                                bounce: 0.2,
                                duration: 0.4,
                              }}
                            />
                          )}

                          <item.icon
                            className={cn(
                              'relative h-5 w-5 shrink-0',
                              isActive && 'text-primary'
                            )}
                          />

                          {!sidebarCollapsed && (
                            <span className="relative flex-1 truncate">
                              {item.label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <Separator className="mt-3" />
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}