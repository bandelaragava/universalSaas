import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  ChevronRight,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/context/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { cn } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'


const pathLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/leads': 'Leads',
  '/reports': 'Reports',
  '/integrations': 'Integrations',
  '/messages': 'Messages',
  '/tickets': 'Support Tickets',
  '/attendance': 'Attendance',
  '/payroll': 'Payroll',
  '/settings': 'Settings',
  '/website': 'My Website',
  '/affiliate': 'Affiliate',
  '/vendor': 'Vendor',
}

export function Header() {
  const { tenant, sidebarCollapsed, setMobileSidebarOpen } = useApp()
  const { theme, toggleTheme } = useTheme()
  const { info, success } = useToast()
  const { logout } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const pageTitle = pathLabels[location.pathname] ?? 'Module'

  const initials = tenant.userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6',
        sidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-[272px]'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{pageTitle}</span>
      </nav>

      <div className="relative ml-auto flex flex-1 items-center gap-2 sm:max-w-md lg:mx-4 lg:max-w-lg">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search modules, users, leads..." className="pl-9 bg-muted/50" />
      </div>





      <Button variant="ghost" size="icon" className="relative" onClick={toggleTheme}>
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => info('Notifications', 'You have 3 unread notifications.')}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{tenant.userName}</p>
            <p className="text-xs font-normal text-muted-foreground">{tenant.userEmail}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>Preferences</DropdownMenuItem>
          <DropdownMenuItem onClick={() => info('Billing', 'Billing module coming soon.')}>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => {
              logout();
              success('Signed out', 'You have been logged out.');
              navigate('/login');
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}


