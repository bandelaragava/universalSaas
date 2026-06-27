import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { IntegrationsPage } from "@/pages/integrations/IntegrationsPage";
import GoogleSuccessPage from "@/pages/google/GoogleSuccessPage";
import GoogleErrorPage from "@/pages/google/GoogleErrorPage";
import ZoomSuccessPage from "@/pages/zoom/ZoomSuccessPage";
import { MessagesPage } from "@/pages/messages/MessagesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import { TicketsPage } from "@/pages/tickets/TicketsPage";
import { MarketingPage } from "@/pages/marketing/MarketingPage";
import { AttendancePage } from "@/pages/hrms/AttendancePage";
import { LeavePage } from "@/pages/hrms/LeavePage";
import { PayrollPage } from "@/pages/hrms/PayrollPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { RevenuePage } from "@/pages/revenue/RevenuePage";
import {
  AccessControlLayout,
  SettingsLayout,
  HrmsLayout,
  CrmLayout,
  VendorLayout,
} from "@/components/layout/ModuleTabsLayout";

// Vendor / Procurement pages
import { useAuth } from "@/auth/AuthContext";
import { usePermissions } from "@/auth/usePermissions";
import Vendors from "@/pages/vendor/Vendors";
import VendorPortal from "@/pages/vendor/VendorPortal";
import VendorAnalyticsDashboard from "@/pages/vendor/VendorAnalyticsDashboard";
import Procurement from "@/pages/procurement/Procurement";
import Contracts from "@/pages/procurement/Contracts";
import Invoices from "@/pages/procurement/Invoices";
import RiskCompliance from "@/pages/procurement/RiskCompliance";
import Performance from "@/pages/procurement/Performance";
import Requirements from "@/pages/procurement/Requirements";
import Receipt from "@/pages/procurement/Receipt";

// CRM setting pages
import LeadStageList from "@/pages/crm/LeadStageList";
import LeadStageForm from "@/pages/crm/LeadStageForm";

// Users module pages
import UserList from "@/pages/UserList";
import UserForm from "@/pages/UserForm";

// Tenants module pages
import TenantsList from "@/pages/TenantsList";
import CreateTenant from "@/pages/CreateTenant";
import TenantDetails from "@/pages/TenantDetails";

// Leads module pages
import LeadsList from "@/modules/leads/pages/LeadsList";
import LeadCreate from "@/modules/leads/pages/LeadCreate";
import LeadDetails from "@/modules/leads/pages/LeadDetails";
import LeadPipeline from "@/modules/leads/pages/LeadPipeline";
import LeadFollowups from "@/modules/leads/pages/LeadFollowups";
import LeadsDashboard from "@/modules/leads/pages/LeadsDashboard";
import FormBuilder from "@/modules/leads/pages/FormBuilder";
import LeadOptions from "@/modules/leads/pages/LeadOptions";

// Authentication & Public pages
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import RegisterUser from "@/pages/RegisterUser";
import Unauthorized from "@/pages/Unauthorized";
import PublicVerificationPage from "@/pages/PublicVerificationPage";
import LandingPage from "@/pages/marketing/LandingPage";

// Roles & Permissions pages
import RoleList from "@/pages/RoleList";
import RoleForm from "@/pages/RoleForm";
import CreateRole from "@/pages/CreateRole";
import RoleHierarchy from "@/pages/RoleHierarchy";
import RoleMapping from "@/pages/RoleMapping";
import Permissions from "@/pages/Permissions";
import CreatePermission from "@/pages/CreatePermission";
import ProtectedRoute from "@/auth/ProtectedRoute";

// Settings module pages
import UserProfilePage from "@/pages/settings/UserProfilePage";
import CompanyProfilePage from "@/pages/settings/CompanyProfilePage";
import IdGenerationSettings from "@/pages/settings/IdGenerationSettings";
import TemplatesPage from "@/pages/settings/TemplatesPage";
import TemplateFormPage from "@/pages/settings/TemplateFormPage";
import CertificatesList from "@/pages/settings/CertificatesList";
import OnboardingRulesPage from "@/pages/settings/OnboardingRulesPage";
import DynamicRoleFieldsPage from "@/pages/settings/DynamicRoleFieldsPage";
import BillingPage from "@/pages/billing/BillingPage";
import BusinessEntityList from "@/pages/settings/BusinessEntityList";
import BusinessEntityForm from "@/pages/settings/BusinessEntityForm";
import DepartmentList from "@/pages/settings/DepartmentList";
import DepartmentForm from "@/pages/settings/DepartmentForm";
import SelfReportsPage from "@/pages/reports/SelfReportsPage";
import SystemSettingsPage from "@/pages/settings/SystemSettingsPage";
import CrmSettingsPage from "@/pages/settings/CrmSettingsPage";
import {
  EmployeeTypeList, EmployeeTypeForm,
  DesignationList, DesignationForm,
  WorkModeList, WorkModeForm
} from "@/pages/settings/LookupPages";
import InvoiceConfigurationList from "@/pages/settings/InvoiceConfigurationList";
import InvoiceConfigurationForm from "@/pages/settings/InvoiceConfigurationForm";


function VendorProtectedRoute({ element }: { element: React.ReactElement }) {
  const auth = useAuth();
  const { hasPermission } = usePermissions();

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission('VENDOR_VIEW') && !hasPermission('VENDOR_MANAGE')) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}

import AffiliateShell from "@/modules/affiliate/AffiliateShell";
import TaskShell from "@/modules/tasks/TaskShell";

export function AppRoutes() {
  return (
    <Routes>
      {/* Standalone Authentication and Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/register" element={<RegisterUser />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/verify/:identifier" element={<PublicVerificationPage />} />
      <Route path="/landing/:slug" element={<LandingPage />} />
      <Route path="/vendor-portal" element={<VendorProtectedRoute element={<VendorPortal />} />} />

      {/* Standalone Receipt Print View */}
      <Route path="/vendor/invoices/:id/receipt" element={<ProtectedRoute element={<Receipt />} module="VENDOR" permission="VENDOR_VIEW" />} />

      {/* Main App Layout Routes */}
      <Route element={<AppLayout />}>
        <Route index element={<ProtectedRoute element={<DashboardPage />} permissions={["DASHBOARD_VIEW", "ATTENDANCE_VIEW_ATTENDANCE", "LEAVE_VIEW_LEAVE", "TASKS_VIEW_TASKS", "LEADS_VIEW_LEADS", "SUPPORT_TICKETS_VIEW_SUPPORT_TICKETS", "REPORTS_VIEW_REPORTS", "REVENUE_VIEW_REVENUE", "VENDOR_VIEW"]} />} />

        {/* Tenants routes */}
        <Route path="tenants" element={<ProtectedRoute element={<TenantsList />} permission="TENANT_VIEW" />} />
        <Route path="create-tenant" element={<ProtectedRoute element={<CreateTenant />} permission="TENANT_VIEW" />} />
        <Route path="tenants/:id" element={<ProtectedRoute element={<TenantDetails />} permission="TENANT_VIEW" />} />

        {/* Access Control Module Routes (Wrapped in AccessControlLayout) */}
        <Route element={<AccessControlLayout />}>
          <Route path="users" element={<ProtectedRoute element={<UserList />} permission="USER_VIEW" />} />
          <Route path="users/create" element={<ProtectedRoute element={<UserForm />} permission="USER_CREATE" />} />
          <Route path="users/edit/:id" element={<ProtectedRoute element={<UserForm />} permission="USER_UPDATE" />} />
          <Route path="users/manage" element={<Navigate to="/users" replace />} />
          <Route path="roles" element={<ProtectedRoute element={<RoleList />} permission="ROLE_VIEW" />} />
          <Route path="roles/create" element={<ProtectedRoute element={<RoleForm />} permission="ROLE_CREATE" />} />
          <Route path="roles/edit/:id" element={<ProtectedRoute element={<RoleForm />} permission="ROLE_UPDATE" />} />
          <Route path="roles/wizard" element={<ProtectedRoute element={<CreateRole />} permission="ROLE_CREATE" />} />
          <Route path="roles/mapping" element={<ProtectedRoute element={<RoleMapping />} permission="ROLE_UPDATE" />} />
          <Route path="role-hierarchy" element={<ProtectedRoute element={<RoleHierarchy />} permission="ROLE_VIEW" />} />
          <Route path="permissions" element={<ProtectedRoute element={<Permissions />} permissions={["PERMISSION_VIEW", "ROLE_VIEW"]} />} />
          <Route path="permissions/create" element={<ProtectedRoute element={<CreatePermission />} permission="ROLE_CREATE" />} />
        </Route>

        {/* Settings Module Routes (Wrapped in SettingsLayout) */}
        <Route element={<SettingsLayout />}>
          <Route path="settings" element={<ProtectedRoute element={<SettingsPage />} permissions={["COMPANY_PROFILE_VIEW", "COMPANY_PROFILE_VIEW", "COMPANY_PROFILE_VIEW"]} />} />
          <Route path="settings/profile" element={<ProtectedRoute element={<UserProfilePage />} />} />
          <Route path="settings/crm" element={<ProtectedRoute element={<CrmSettingsPage />} permissions={["LEADS_MANAGE_LEAD_FORMS", "COMPANY_PROFILE_VIEW"]} />} />
          <Route path="settings/company" element={<ProtectedRoute element={<CompanyProfilePage />} permissions={["COMPANY_PROFILE_VIEW", "COMPANY_PROFILE_VIEW", "COMPANY_PROFILE_VIEW"]} />} />
          <Route path="settings/billing" element={<ProtectedRoute element={<BillingPage />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/entities" element={<ProtectedRoute element={<BusinessEntityList />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/entities/create" element={<ProtectedRoute element={<BusinessEntityForm />} permission="ROLE_CREATE" />} />
          <Route path="settings/entities/edit/:id" element={<ProtectedRoute element={<BusinessEntityForm />} permission="ROLE_UPDATE" />} />
          <Route path="settings/departments" element={<ProtectedRoute element={<DepartmentList />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/departments/create" element={<ProtectedRoute element={<DepartmentForm />} permission="ROLE_CREATE" />} />
          <Route path="settings/departments/edit/:id" element={<ProtectedRoute element={<DepartmentForm />} permission="ROLE_UPDATE" />} />
          <Route path="settings/employee-types" element={<ProtectedRoute element={<EmployeeTypeList />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/employee-types/create" element={<ProtectedRoute element={<EmployeeTypeForm />} permission="ROLE_CREATE" />} />
          <Route path="settings/employee-types/edit/:id" element={<ProtectedRoute element={<EmployeeTypeForm />} permission="ROLE_UPDATE" />} />
          <Route path="settings/designations" element={<ProtectedRoute element={<DesignationList />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/designations/create" element={<ProtectedRoute element={<DesignationForm />} permission="ROLE_CREATE" />} />
          <Route path="settings/designations/edit/:id" element={<ProtectedRoute element={<DesignationForm />} permission="ROLE_UPDATE" />} />
          <Route path="settings/work-modes" element={<ProtectedRoute element={<WorkModeList />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/work-modes/create" element={<ProtectedRoute element={<WorkModeForm />} permission="ROLE_CREATE" />} />
          <Route path="settings/work-modes/edit/:id" element={<ProtectedRoute element={<WorkModeForm />} permission="ROLE_UPDATE" />} />
          <Route path="settings/id-generation" element={<ProtectedRoute element={<IdGenerationSettings />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/templates" element={<ProtectedRoute element={<TemplatesPage />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/templates/create" element={<ProtectedRoute element={<TemplateFormPage />} permission="ROLE_CREATE" />} />
          <Route path="settings/templates/edit/:id" element={<ProtectedRoute element={<TemplateFormPage />} permission="ROLE_UPDATE" />} />
          <Route path="settings/certificates" element={<ProtectedRoute element={<CertificatesList />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/onboarding-rules" element={<ProtectedRoute element={<OnboardingRulesPage />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/dynamic-role-fields" element={<ProtectedRoute element={<DynamicRoleFieldsPage />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/system" element={<ProtectedRoute element={<SystemSettingsPage />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/invoice-configurations" element={<ProtectedRoute element={<InvoiceConfigurationList />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/invoice-configurations/create" element={<ProtectedRoute element={<InvoiceConfigurationForm />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="settings/invoice-configurations/edit/:id" element={<ProtectedRoute element={<InvoiceConfigurationForm />} permission="COMPANY_PROFILE_VIEW" />} />
          <Route path="leads/form-builder" element={<ProtectedRoute element={<FormBuilder />} module="crm" permissions={["LEADS_MANAGE_LEAD_FORMS", "LEADS_MANAGE_LEAD_FORMS", "LEADS_MANAGE_LEAD_FORMS"]} />} />
          <Route path="leads/options" element={<ProtectedRoute element={<LeadOptions />} module="crm" permissions={["LEADS_MANAGE_LEAD_FORMS", "LEADS_MANAGE_LEAD_FORMS", "LEADS_MANAGE_LEAD_FORMS"]} />} />
          <Route path="crm/stages" element={<ProtectedRoute element={<LeadStageList />} module="crm" permissions={["LEADS_VIEW_LEADS", "LEADS_MANAGE_LEAD_FORMS"]} />} />
          <Route path="crm/stages/create" element={<ProtectedRoute element={<LeadStageForm />} module="crm" permission="LEADS_MANAGE_LEAD_FORMS" />} />
          <Route path="crm/stages/edit/:id" element={<ProtectedRoute element={<LeadStageForm />} module="crm" permission="LEADS_MANAGE_LEAD_FORMS" />} />
        </Route>

        {/* HRMS Module Routes (Wrapped in HrmsLayout) */}
        <Route element={<HrmsLayout />}>
          <Route path="attendance" element={<ProtectedRoute element={<AttendancePage />} module="hrms" permission="ATTENDANCE_VIEW_ATTENDANCE" />} />
          <Route path="leave" element={<ProtectedRoute element={<LeavePage />} module="hrms" permission="LEAVE_VIEW_LEAVE" />} />
          <Route path="payroll" element={<ProtectedRoute element={<PayrollPage />} module="hrms" permissions={["PAYROLL_VIEW_SALARY", "PAYROLL_VIEW_SALARY", "PAYROLL_VIEW_PAYSLIP"]} />} />
        </Route>

        {/* CRM Module Routes (Wrapped in CrmLayout) */}
        <Route element={<CrmLayout />}>
          <Route path="leads" element={<ProtectedRoute element={<LeadsList />} module="crm" permission="LEADS_VIEW_LEADS" />} />
          <Route path="leads/create" element={<ProtectedRoute element={<LeadCreate />} module="crm" permission="LEADS_CREATE_LEAD" />} />
          <Route path="leads/student-form" element={<ProtectedRoute element={<LeadCreate />} module="crm" permission="LEADS_CREATE_LEAD" />} />
          <Route path="leads/add-lead" element={<ProtectedRoute element={<LeadCreate />} module="crm" permission="LEADS_CREATE_LEAD" />} />
          <Route path="leads/pipeline" element={<ProtectedRoute element={<LeadPipeline />} module="crm" permission="LEADS_VIEW_LEADS" />} />
          <Route path="leads/followups" element={<ProtectedRoute element={<LeadFollowups />} module="crm" permissions={["LEADS_VIEW_LEADS", "LEADS_VIEW_FOLLOWUPS"]} />} />
          <Route path="leads/follow-ups" element={<ProtectedRoute element={<LeadFollowups />} module="crm" permissions={["LEADS_VIEW_LEADS", "LEADS_VIEW_FOLLOWUPS"]} />} />
          <Route path="leads/dashboard" element={<ProtectedRoute element={<LeadsDashboard />} module="crm" permissions={["LEADS_VIEW_LEADS", "LEADS_VIEW_LEAD_ANALYTICS"]} />} />
          <Route path="leads/:id" element={<ProtectedRoute element={<LeadDetails />} module="crm" permission="LEADS_VIEW_LEADS" />} />
        </Route>

        {/* Vendor and Procurement routes (Wrapped in VendorLayout) */}
        <Route element={<VendorLayout />}>
          <Route path="vendor/vendors" element={<ProtectedRoute element={<Vendors />} module="VENDOR" permission="VENDOR_VIEW" />} />
          <Route path="vendor/analytics" element={<ProtectedRoute element={<VendorAnalyticsDashboard />} module="VENDOR" permissions={["VENDOR_VIEW", "VENDOR_MANAGE"]} />} />
          <Route path="vendor/assets" element={<ProtectedRoute element={<Procurement />} module="VENDOR" permission="VENDOR_VIEW" />} />
          <Route path="vendor/contracts" element={<ProtectedRoute element={<Contracts />} module="VENDOR" permission="VENDOR_VIEW" />} />
          <Route path="vendor/invoices" element={<ProtectedRoute element={<Invoices />} module="VENDOR" permission="VENDOR_VIEW" />} />
          <Route path="vendor/requirements" element={<ProtectedRoute element={<Requirements />} module="VENDOR" permission="VENDOR_VIEW" />} />
          <Route path="vendor/performance" element={<ProtectedRoute element={<Performance />} module="VENDOR" permission="VENDOR_VIEW" />} />
          <Route path="vendor/risk-compliance" element={<ProtectedRoute element={<RiskCompliance />} module="VENDOR" permissions={["VENDOR_VIEW", "VENDOR_MANAGE"]} />} />
          <Route path="vendor" element={<Navigate to="/vendor/analytics" replace />} />
          <Route path="vendor-dashboard" element={<Navigate to="/vendor/analytics" replace />} />
        </Route>

        {/* Other routes */}
        <Route path="integrations" element={<ProtectedRoute element={<IntegrationsPage />} permissions={["SETTINGS_MANAGE_SETTINGS", "COMPANY_PROFILE_VIEW"]} />} />
        <Route path="google/success" element={<ProtectedRoute element={<GoogleSuccessPage />} permissions={["SETTINGS_MANAGE_SETTINGS", "COMPANY_PROFILE_VIEW"]} />} />
        <Route path="google/error" element={<ProtectedRoute element={<GoogleErrorPage />} permissions={["SETTINGS_MANAGE_SETTINGS", "COMPANY_PROFILE_VIEW"]} />} />
        <Route path="zoom/success" element={<ProtectedRoute element={<ZoomSuccessPage />} permissions={["SETTINGS_MANAGE_SETTINGS", "COMPANY_PROFILE_VIEW"]} />} />
        <Route path="notifications" element={<ProtectedRoute element={<NotificationsPage />} />} />
        <Route path="messages" element={<ProtectedRoute element={<MessagesPage />} permission="MESSAGE_VIEW" />} />
        <Route path="tickets" element={<ProtectedRoute element={<TicketsPage />} permissions={["SUPPORT_TICKETS_RAISE_SUPPORT_TICKET", "SUPPORT_TICKETS_VIEW_SUPPORT_TICKETS", "SUPPORT_TICKETS_MANAGE_SUPPORT_TICKETS", "manage_support_ticket_types", "SUPPORT_TICKETS_VIEW_SUPPORT_TICKETS"]} />} />
        <Route path="affiliate" element={<ProtectedRoute element={<AffiliateShell />} module="AFFILIATE" permissions={["AFFILIATE_VIEW_AFFILIATE", "AFFILIATE_MANAGE_AFFILIATE"]} />} />
        <Route path="marketing" element={<ProtectedRoute element={<MarketingPage variant="marketing" />} module="MARKETING" permissions={["MARKETING_VIEW", "MARKETING_CREATE", "MARKETING_UPDATE", "MARKETING_DELETE", "MARKETING_CAMPAIGN_VIEW", "MARKETING_ANALYTICS_VIEW", "MARKETING_AJAY_SUMMARY", "MARKETING_ANALYTICS_SUMMARY"]} />} />
        <Route path="referrals" element={<ProtectedRoute element={<MarketingPage variant="referrals" />} module="MARKETING" permissions={["MARKETING_VIEW", "MARKETING_CREATE", "MARKETING_UPDATE", "MARKETING_DELETE", "MARKETING_CAMPAIGN_VIEW", "MARKETING_ANALYTICS_VIEW", "MARKETING_AJAY_SUMMARY", "MARKETING_ANALYTICS_SUMMARY"]} />} />
        <Route path="reports" element={<ProtectedRoute element={<ReportsPage />} permission="REPORTS_VIEW_REPORTS" />} />
        <Route path="self-reports" element={<ProtectedRoute element={<SelfReportsPage forcedScope="self" />} permission="REPORTS_SELF_REPORTS" />} />
        <Route path="tasks" element={<ProtectedRoute element={<TaskShell />} permission="TASKS_VIEW_TASKS" />} />
        <Route path="revenue" element={<ProtectedRoute element={<RevenuePage />} permission="REVENUE_VIEW_REVENUE" />} />

        {/* Legacy LAP redirects */}
        <Route path="dashboard/attendance" element={<Navigate to="/attendance" replace />} />
        <Route path="dashboard/payroll" element={<Navigate to="/payroll" replace />} />
        <Route path="dashboard/leave" element={<Navigate to="/leave" replace />} />
        <Route path="dashboard/reports" element={<Navigate to="/reports" replace />} />
        <Route path="dashboard/self-reports" element={<Navigate to="/self-reports" replace />} />
        <Route path="dashboard/support-tickets" element={<Navigate to="/tickets" replace />} />
        <Route path="dashboard/employees" element={<Navigate to="/users" replace />} />
        <Route path="dashboard/departments" element={<Navigate to="/settings/departments" replace />} />
        <Route path="dashboard/settings" element={<Navigate to="/settings/company" replace />} />
        <Route path="dashboard/settings/system" element={<Navigate to="/settings/system" replace />} />
        <Route path="dashboard/permissions" element={<Navigate to="/permissions" replace />} />
        <Route path="dashboard/tasks" element={<Navigate to="/tasks" replace />} />
        <Route path="dashboard/leads" element={<Navigate to="/leads" replace />} />
        <Route path="dashboard/leads/student-form" element={<Navigate to="/leads/student-form" replace />} />
        <Route path="dashboard/leads/add-lead" element={<Navigate to="/leads/add-lead" replace />} />
        <Route path="dashboard/leads/follow-ups" element={<Navigate to="/leads/follow-ups" replace />} />
        <Route path="dashboard/leads/form-builder" element={<Navigate to="/leads/form-builder" replace />} />
        <Route path="dashboard/leads/options" element={<Navigate to="/leads/options" replace />} />
        <Route path="dashboard/leads/:id" element={<ProtectedRoute element={<LeadDetails />} module="crm" permission="LEADS_VIEW_LEADS" />} />
        <Route path="dashboard/revenue" element={<Navigate to="/revenue" replace />} />
        <Route path="dashboard/affiliate" element={<Navigate to="/affiliate" replace />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />

        {/* Legacy vendor-dashboard redirects */}
        <Route path="vendor-dashboard/analytics" element={<Navigate to="/vendor/analytics" replace />} />
        <Route path="vendor-dashboard/vendors" element={<Navigate to="/vendor/vendors" replace />} />
        <Route path="vendor-dashboard/invoices" element={<Navigate to="/vendor/invoices" replace />} />
        <Route path="vendor-dashboard/requirements" element={<Navigate to="/vendor/requirements" replace />} />
        <Route path="vendor-dashboard/contracts" element={<Navigate to="/vendor/contracts" replace />} />
        <Route path="vendor-dashboard/performance" element={<Navigate to="/vendor/performance" replace />} />
        <Route path="vendor-dashboard/risk-compliance" element={<Navigate to="/vendor/risk-compliance" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}


