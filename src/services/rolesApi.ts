import axios, { InternalAxiosRequestConfig } from 'axios';
import { hasPermission } from '@/auth/permissionUtils';

declare module 'axios' {
  export interface AxiosRequestConfig {
    ignore403?: boolean;
  }
}

const ROLES_API_BASE = import.meta.env.VITE_ROLES_API_BASE || import.meta.env.VITE_API_BASE || '/api';
const LAP_API_BASE = import.meta.env.VITE_LAP_API_BASE || import.meta.env.VITE_API_BASE || '/api';

const MUTATION_PERMISSIONS = [
  { pattern: /^\/users/, methods: ['POST'], permission: 'USER_CREATE' },
  { pattern: /^\/users\/\d+/, methods: ['PUT', 'PATCH'], permission: 'USER_UPDATE' },
  { pattern: /^\/users\/\d+/, methods: ['DELETE'], permission: 'USER_DELETE' },
  { pattern: /^\/users\/\d+\/toggle-active/, methods: ['PATCH'], permission: 'USER_UPDATE' },
  
  { pattern: /^\/roles/, methods: ['POST'], permission: 'ROLE_CREATE' },
  { pattern: /^\/roles\/\d+/, methods: ['PUT', 'PATCH'], permission: 'ROLE_UPDATE' },
  { pattern: /^\/roles\/\d+/, methods: ['DELETE'], permission: 'ROLE_DISABLE' },
  
  { pattern: /^\/permissions/, methods: ['POST', 'PUT'], permission: 'ROLE_UPDATE' },
  
  { pattern: /^\/payroll/, methods: ['POST', 'PUT', 'PATCH'], permission: 'PAYROLL_PROCESS_PAYROLL' },
  
  { pattern: /^\/leave\/apply/, methods: ['POST'], permission: 'LEAVE_CREATE' },
  { pattern: /^\/leave\/\d+\/action/, methods: ['POST'], permission: 'LEAVE_MANAGE' },
  { pattern: /^\/leave\/\d+\/cancel/, methods: ['POST'], permission: 'LEAVE_CREATE' },
  
  { pattern: /^\/attendance\/checkin/, methods: ['POST'], permission: 'ATTENDANCE_CREATE' },
  { pattern: /^\/attendance\/checkout/, methods: ['POST'], permission: 'ATTENDANCE_CREATE' },
  { pattern: /^\/attendance\/regularize/, methods: ['POST'], permission: 'ATTENDANCE_CREATE' },
  { pattern: /^\/attendance\/regularize\/\d+\/action/, methods: ['POST'], permission: 'ATTENDANCE_VIEW_ATTENDANCE' },
  
  { pattern: /^\/leads/, methods: ['POST', 'PUT', 'PATCH'], permission: 'LEADS_CREATE_LEAD' },
  
  { pattern: /^\/vendors/, methods: ['POST', 'PUT', 'PATCH'], permission: 'VENDOR_CREATE' },
  { pattern: /^\/vendor-categories/, methods: ['POST'], permission: 'VENDOR_CREATE' },
  
  { pattern: /^\/support\/tickets\/raise/, methods: ['POST'], permission: 'SUPPORT_TICKETS_RAISE_SUPPORT_TICKET' },
  { pattern: /^\/support\/tickets\/\d+\/action/, methods: ['POST'], permission: 'SUPPORT_TICKETS_MANAGE_SUPPORT_TICKETS' },
  
  { pattern: /^\/system-settings/, methods: ['POST', 'PUT'], permission: 'SETTINGS_MANAGE_SETTINGS' },
];

const rolesApi = axios.create({
  baseURL: ROLES_API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token and X-Tenant header dynamically
rolesApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';
    const method = (config.method || 'GET').toUpperCase();

    // CENTRAL API MUTATION SAFETY GUARD
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const rule = MUTATION_PERMISSIONS.find(r => r.methods.includes(method) && r.pattern.test(url));
      if (rule) {
        const storedRole = localStorage.getItem('role') || '';
        const normalizedRole = String(storedRole).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
        const isSuperAdmin = ['SUPER_ADMIN', 'SUPERADMIN', 'PLATFORM_ADMIN', 'SYSTEM_ADMIN'].includes(normalizedRole);

        if (!isSuperAdmin) {
          const storedPerms = localStorage.getItem('permissions');
          let permissions: string[];
          try {
            permissions = JSON.parse(storedPerms || '[]');
          } catch {
            permissions = [];
          }

          if (!hasPermission(permissions, rule.permission)) {
            return Promise.reject(new Error(`Security Block: Outgoing request ${method} ${url} requires '${rule.permission}' permission.`));
          }
        }
      }
    }
    // Determine the base URL dynamically based on the URL path
    let isLapRoute = 
      url.startsWith('/attendance') ||
      url.startsWith('/leave') ||
      url.startsWith('/payroll') ||
      url.startsWith('/reports') ||
      url.startsWith('/self-reports') ||
      url.startsWith('/employees') ||
      url.startsWith('/notifications') ||
      url.startsWith('/system-settings') ||
      url.startsWith('/tasks') ||
      url.startsWith('/affiliate') ||
      url.startsWith('/leads') ||
      url.startsWith('/tickets') ||
      url.startsWith('/support') ||
      url.startsWith('/revenue') ||
      url.startsWith('/admin') ||
      url.startsWith('/vendor') ||
      url.startsWith('/vendors') ||
      url.startsWith('/crm') ||
      url.startsWith('/hrms');

    if (url.startsWith('/admin/marketing') || url.startsWith('/admin/departments')) {
      isLapRoute = false;
    }

    config.baseURL = isLapRoute ? '/lap-api' : ROLES_API_BASE;

    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const tenantCode = localStorage.getItem('tenantCode');
    if (tenantCode && config.headers) {
      config.headers['X-Tenant'] = tenantCode;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to catch 401/403 responses globally
rolesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('permissions');
        localStorage.removeItem('modules');
        localStorage.removeItem('tenantCode');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        if (!import.meta.env.DEV && !error.config?.ignore403 && window.location.pathname !== '/unauthorized') {
          window.location.href = '/unauthorized';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default rolesApi;

