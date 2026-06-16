import React from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/auth/usePermissions';

interface TabItem {
  label: string;
  path: string;
  permissions?: string[];
}

const TABS: Record<string, TabItem[]> = {
  'access-control': [
    { label: 'Users Directory', path: '/users', permissions: ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE'] },
    { label: 'Roles List', path: '/roles', permissions: ['ROLE_VIEW'] },
    { label: 'Role Mapping', path: '/roles/mapping', permissions: ['ROLE_UPDATE'] },
    { label: 'Role Hierarchy', path: '/role-hierarchy', permissions: ['ROLE_VIEW'] },
    { label: 'Permissions Registry', path: '/permissions', permissions: ['ROLE_VIEW', 'ROLE_UPDATE'] },
  ],
  'settings': [
    { label: 'Company Profile', path: '/settings/company', permissions: ['ROLE_VIEW', 'COMPANY_PROFILE_VIEW'] },
    { label: 'Billing & Plans', path: '/settings/billing', permissions: ['ROLE_VIEW', 'SUBSCRIPTION_MANAGE'] },
    { label: 'Business Entities', path: '/settings/entities', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_SETTINGS'] },
    { label: 'Departments', path: '/settings/departments', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_SETTINGS'] },
    { label: 'Employee Types', path: '/settings/employee-types', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_SETTINGS'] },
    { label: 'Designations', path: '/settings/designations', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_SETTINGS'] },
    { label: 'Work Modes', path: '/settings/work-modes', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_SETTINGS'] },
    { label: 'ID Formats', path: '/settings/id-generation', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_ID_FORMATS'] },
    { label: 'Doc Templates', path: '/settings/templates', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_TEMPLATES'] },
    { label: 'Certificates List', path: '/settings/certificates', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_TEMPLATES'] },
    { label: 'System Settings', path: '/settings/system', permissions: ['ROLE_VIEW', 'SETTINGS_MANAGE_SETTINGS'] },
  ],
  'hrms': [
    { label: 'Attendance', path: '/attendance', permissions: ['ATTENDANCE_VIEW_ATTENDANCE'] },
    { label: 'Leave', path: '/leave', permissions: ['LEAVE_VIEW_LEAVE'] },
    { label: 'Payroll', path: '/payroll', permissions: ['PAYROLL_VIEW_SALARY', 'PAYROLL_VIEW_PAYSLIP'] },
  ],
  'crm': [
    { label: 'All Leads', path: '/leads', permissions: ['LEADS_VIEW_LEADS'] },
    { label: 'Follow Ups', path: '/leads/follow-ups', permissions: ['LEADS_VIEW_FOLLOWUPS'] },
  ],
  'vendor': [
    { label: 'Vendor Dashboard', path: '/vendor/analytics', permissions: ['VENDOR_VIEW'] },
    { label: 'Vendor Directory', path: '/vendor/vendors', permissions: ['VENDOR_VIEW'] },
    { label: 'Requirements', path: '/vendor/requirements', permissions: ['VENDOR_VIEW'] },
    { label: 'Contracts', path: '/vendor/contracts', permissions: ['VENDOR_CONTRACT_VIEW'] },
    { label: 'Invoices', path: '/vendor/invoices', permissions: ['VENDOR_INVOICE_VIEW'] },
    { label: 'Performance', path: '/vendor/performance', permissions: ['PERFORMANCE_VIEW', 'VENDOR_VIEW'] },
    { label: 'Risk & Compliance', path: '/vendor/risk-compliance', permissions: ['VENDOR_AUDIT_VIEW', 'VENDOR_VIEW'] },
  ],
};

function ModuleTabsHeader({ moduleName }: { moduleName: string }) {
  const { hasAnyPermission } = usePermissions();
  const items = (TABS[moduleName] ?? []).filter((item) =>
    item.permissions?.length ? hasAnyPermission(item.permissions) : true
  );
  const location = useLocation();

  if (!items || items.length === 0) return null;

  return (
    <div className="flex gap-1 border-b border-border/60 pb-px overflow-x-auto custom-scrollbar whitespace-nowrap">
      {items.map((item) => {
        let isActive = location.pathname === item.path;
        if (!isActive) {
          const hasSiblingTabMatch = items.some(sibling =>
            sibling.path !== item.path &&
            sibling.path !== '/' &&
            (location.pathname === sibling.path || location.pathname.startsWith(sibling.path + '/'))
          );
          if (!hasSiblingTabMatch) {
            isActive = (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ||
              (item.path === '/users' && location.pathname.startsWith('/users/'));
          }
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/leads' || item.path === '/users' || item.path === '/settings' || item.path === '/leave'}
            className={({ isActive: navActive }) => cn(
              "px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer",
              (isActive || navActive)
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            {item.label}
          </NavLink>
        );
      })}
    </div>
  );
}

export function AccessControlLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabsHeader moduleName="access-control" />
      <Outlet />
    </div>
  );
}

export function SettingsLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabsHeader moduleName="settings" />
      <Outlet />
    </div>
  );
}

export function HrmsLayout() {
  return (
    <div className="hrms-workspace">
      <div className="bg-[#f4f7ff] dark:bg-indigo-950/20 px-4 lg:px-6 pt-4 lg:pt-6 -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 pb-8 border-b border-border mb-6">
        <ModuleTabsHeader moduleName="hrms" />
        <div id="hrms-header-portal" className="mt-8"></div>
      </div>
      <Outlet />
    </div>
  );
}

export function CrmLayout() {
  return (
    <div className="crm-workspace">
      <div className="bg-[#f4f7ff] dark:bg-indigo-950/20 px-4 lg:px-6 pt-4 lg:pt-6 -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 pb-8 border-b border-border mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 overflow-hidden">
            <ModuleTabsHeader moduleName="crm" />
          </div>
          <div className="border-b border-border/60 flex items-center justify-end h-full w-10">
            <NavLink to="/settings/crm" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-muted mb-1 flex-shrink-0" title="CRM Settings">
              <Settings className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
        <div id="crm-header-portal" className="mt-8"></div>
      </div>
      <Outlet />
    </div>
  );
}

export function VendorLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabsHeader moduleName="vendor" />
      <Outlet />
    </div>
  );
}


