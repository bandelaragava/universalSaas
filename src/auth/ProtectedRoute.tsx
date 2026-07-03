import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { usePermissions } from './usePermissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  element: React.ReactElement;
  permission?: string;
  permissions?: string[];
  module?: string;
  isPlatformAdminRequired?: boolean;
}

export default function ProtectedRoute({ element, permission, permissions, module, isPlatformAdminRequired }: ProtectedRouteProps) {
  const auth = useAuth();
  const { hasPermission, isModuleEnabled, isPlatformAdmin } = usePermissions();
  const requiredPermissions = permissions || (permission ? [permission] : []);
  
  // New relaxed logic: allow access if user has required permission OR required module
  // Normalize module name to uppercase and map legacy aliases to actual backend modules
  const normalizedModule = module ? module.toUpperCase() : undefined;
  const moduleAliasMap: Record<string, string[]> = {
    CRM: ['LEADS'], // legacy "crm" maps to leads module
    HRMS: ['ATTENDANCE', 'LEAVE', 'PAYROLL'], // legacy "hrms" maps to its sub-modules
  };
  const moduleCandidates = normalizedModule ? (moduleAliasMap[normalizedModule] || [normalizedModule]) : [];

  // Permission check: pass if there is no permission requirement or the user possesses any of them
  const permissionPassed = requiredPermissions.length === 0 || requiredPermissions.some((p) => hasPermission(p));

  // Module check: pass if there is no module requirement or any candidate module is enabled for the user
  const modulePassed = moduleCandidates.length === 0 || moduleCandidates.some((m) => isModuleEnabled(m));

  // Platform-admin bypass (if required)
  const platformPassed = isPlatformAdminRequired ? isPlatformAdmin : true;

  const finalAllowed = platformPassed && permissionPassed && modulePassed;

  if (!auth) return element;

  const { isAuthenticated, loading } = auth;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const debugLog = {
      currentPath: window.location.pathname,
      requiredPermission: permission,
      requiredPermissions,
      requiredModule: module,
      userPermissions: auth.permissions,
      userModules: auth.modules,
      isPlatformAdmin,
      reason: 'Not authenticated'
    };
    console.warn('[AUTH DEBUG]', debugLog);
    try {
      localStorage.setItem('last_auth_debug_log', JSON.stringify(debugLog));
    } catch (error) {
      console.warn('Auth debug log storage failed:', error);
    }
    return <Navigate to="/login" replace />;
  }

  if (!finalAllowed) {
    if (import.meta.env.DEV) {
      const debugLog = {
        currentPath: window.location.pathname,
        requiredPermission: permission,
        requiredPermissions,
        requiredModule: module,
        normalizedModule,
        moduleCandidates,
        userPermissions: auth.permissions,
        userModules: auth.modules,
        isPlatformAdmin,
        reason: 'Access denied by ProtectedRoute logic'
      };
      console.warn('[AUTH DEBUG]', debugLog);
      try {
        localStorage.setItem('last_auth_debug_log', JSON.stringify(debugLog));
      } catch (error) {
        console.warn('Auth debug log storage failed:', error);
      }
      return <Navigate to="/unauthorized" replace />;
    }

    // Production routing: Redirect to dashboard safely
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
      return <Navigate to="/unauthorized" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // All checks passed - render the protected element
  return element;
}
