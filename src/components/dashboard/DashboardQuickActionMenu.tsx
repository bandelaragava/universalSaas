import { Plus } from 'lucide-react'
import { quickActionDefinitions, type QuickActionId } from '@/config/quick-actions'
import { useDashboardActions } from '@/context/DashboardActionContext'
import { usePermissions } from '@/auth/usePermissions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const actionPermissions: Record<string, string[]> = {
  'add-user': ['USER_CREATE', 'USER_CREATE'],
  'add-lead': ['LEADS_CREATE_LEAD', 'LEADS_CREATE_LEAD'],
  'create-task': ['TASKS_CREATE_TASK', 'TASKS_EDIT_TASK'],
  payroll: ['PAYROLL_PROCESS_PAYROLL', 'PAYROLL_PROCESS_PAYROLL'],
  ticket: ['SUPPORT_TICKETS_RAISE_SUPPORT_TICKET', 'SUPPORT_TICKETS_RAISE_SUPPORT_TICKET'],
  report: ['REPORTS_VIEW_REPORTS', 'REPORTS_VIEW_REPORTS'],
  announce: ['ANNOUNCEMENT_CREATE', 'NOTIFICATION_CREATE'],
  followup: ['LEADS_CREATE_FOLLOWUP', 'LEADS_CREATE_LEAD'],
}

export function DashboardQuickActionMenu() {
  const { runQuickAction } = useDashboardActions()
  const { hasAnyPermission } = usePermissions()
  const visibleActions = quickActionDefinitions.filter((action) =>
    hasAnyPermission(actionPermissions[action.id] || [])
  )

  if (visibleActions.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1 shadow-md">
          <Plus className="h-4 w-4" />
          Quick Action
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleActions.map((action) => {
          const Icon = action.icon
          return (
            <DropdownMenuItem
              key={action.id}
              className="gap-2 cursor-pointer"
              onClick={() => runQuickAction(action.id)}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


