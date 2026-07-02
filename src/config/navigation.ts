import {
    LayoutDashboard,
    Users,
    CheckSquare,
    IndianRupee,
    Clock,
    Headphones,
    Share2,
    Megaphone,
    BarChart3,
    Settings,
    Store,
    Shield,
    Building,
    Blocks,
} from 'lucide-react'

export interface MenuItem {
    id: string
    label: string
    path: string
    icon: any
    permission?: string
    permissions?: string[]
    requiredModules?: string[]
    badge?: number
}

export interface MenuSection {
    id: string
    label: string
    items: MenuItem[]
}

export const menuConfig: MenuSection[] = [
    {
        id: 'main',
        label: 'Workspace',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                path: '/',
                icon: LayoutDashboard,
            },
            {
                id: 'crm',
                label: 'CRM',
                path: '/leads',
                icon: Users,
                permissions: [
                    'LEADS_VIEW_LEADS',
                    'LEADS_CREATE_LEAD',
                    'LEADS_EDIT_LEAD',
                    'LEADS_DELETE_LEAD',
                    'LEADS_VIEW_FOLLOWUPS',
                    'LEADS_VIEW_LEAD_ANALYTICS',
                    'LEADS_MANAGE_LEAD_FORMS',
                ],
                requiredModules: ['CRM', 'LEADS'],
            },
            {
                id: 'revenue',
                label: 'Revenue',
                path: '/revenue',
                icon: IndianRupee,
                permissions: [
                    'REVENUE_VIEW_REVENUE',
                ],
                requiredModules: ['REVENUE'],
            },
            {
                id: 'tasks',
                label: 'Tasks',
                path: '/tasks',
                icon: CheckSquare,
                permissions: [
                    'TASKS_VIEW_TASKS',
                    'TASKS_CREATE_TASK',
                    'TASKS_EDIT_TASK',
                    'TASKS_DELETE_TASK',
                    'TASKS_ASSIGN_TASK',
                    'TASKS_VIEW_TEAM_TASKS',
                ],
                requiredModules: ['TASKS'],
            },
            {
                id: 'hrms',
                label: 'HRMS',
                path: '/attendance',
                icon: Clock,
                permissions: [
                    'ATTENDANCE_VIEW_ATTENDANCE',
                    'LEAVE_VIEW_LEAVE',
                    'LEAVE_APPLY_LEAVE',
                    'PAYROLL_VIEW_SALARY',
                ],
                requiredModules: ['HRMS', 'ATTENDANCE', 'LEAVE', 'PAYROLL'],
            },
            {
                id: 'tickets',
                label: 'Support Tickets',
                path: '/tickets',
                icon: Headphones,
                permissions: [
                    'SUPPORT_TICKETS_VIEW_SUPPORT_TICKETS',
                    'SUPPORT_TICKETS_RAISE_SUPPORT_TICKET',
                    'SUPPORT_TICKETS_MANAGE_SUPPORT_TICKETS',
                    'SUPPORT_TICKETS_MANAGE_SUPPORT_TICKET_TYPES',
                ],
                requiredModules: ['SUPPORT_TICKETS'],
            },
            {
                id: 'marketing',
                label: 'Marketing',
                path: '/marketing',
                icon: Megaphone,
                permissions: [
                    'MARKETING_VIEW',
                ],
                requiredModules: ['MARKETING'],
            },
            {
                id: 'reports',
                label: 'Reports',
                path: '/reports',
                icon: BarChart3,
                permissions: [
                    'REPORTS_VIEW_REPORTS',
                ],
                requiredModules: ['REPORTS'],
            },
            {
                id: 'vendor',
                label: 'Vendor Management',
                path: '/vendor/analytics',
                icon: Store,
                permissions: [
                    'VENDOR_VIEW',
                ],
                requiredModules: ['VENDOR'],
            },
            {
                id: 'affiliate',
                label: 'Affiliate',
                path: '/affiliate',
                icon: Share2,
                permissions: [
                    'AFFILIATE_VIEW_AFFILIATE',
                ],
                requiredModules: ['AFFILIATE'],
            },

            {
                id: 'settings',
                label: 'Settings',
                path: '/settings',
                icon: Settings,
                permissions: [
                    'SETTINGS_MANAGE_SETTINGS',
                    'SETTINGS_MANAGE_ID_FORMATS',
                    'SETTINGS_MANAGE_TEMPLATES',
                    'SUBSCRIPTION_MANAGE'
                ],
                requiredModules: ['SETTINGS'],
            },


        ],
    },
    {
        id: 'platform',
        label: 'Platform Admin',
        items: [
            {
                id: 'tenants',
                label: 'Tenants',
                path: '/tenants',
                icon: Building,
                permissions: [
                    'TENANT_VIEW',
                    'TENANT_CREATE',
                    'TENANT_UPDATE',
                    'TENANT_ENABLE',
                    'TENANT_DISABLE',
                ],
                requiredModules: ['ADMIN'],
            },
        ],
    },
]

export const placeholderRoutes = [
    { path: '/users', title: 'Users', description: 'Manage organization users, roles, and access.' },
    { path: '/leads', title: 'Leads', description: 'Track and convert leads across your pipeline.' },
    { path: '/followups', title: 'Followups', description: 'Schedule and monitor customer follow-ups.' },
    { path: '/tasks', title: 'Tasks', description: 'Assign and track team tasks and workflows.' },
    { path: '/revenue', title: 'Revenue', description: 'Monitor revenue streams and forecasts.' },
]

export { quickActionDefinitions as quickActions } from '@/config/quick-actions'