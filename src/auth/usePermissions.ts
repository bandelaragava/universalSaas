import { useAuth } from './AuthContext';
import { hasPermission as checkPermission, hasAnyPermission, hasAllPermissions, isPlatformAdmin as checkPlatformAdmin } from './permissionUtils';
import { isModuleEnabled as checkModuleEnabled } from './moduleUtils';
import { useCallback } from 'react';

const WILDCARD_PERMISSIONS = ['*'];
const EMPTY_PERMISSIONS: string[] = [];

export function usePermissions() {
  const auth = useAuth();
  const rawPermissions = auth?.permissions || EMPTY_PERMISSIONS;
  const modules = auth?.modules || EMPTY_PERMISSIONS;
  const user = auth?.user || null;
  const normalizedRole = String(user?.role || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  // Full access is granted explicitly or if the user is SUPER_ADMIN / Platform Admin
  const hasFullAccess = rawPermissions.includes('*') || normalizedRole === 'SUPER_ADMIN' || user?.isPlatformAdmin;
  const permissions = rawPermissions; // keep actual permissions; do not replace with wildcard based on role
  const isSuperAdmin = hasFullAccess; // retain naming for downstream logic

  const isPlatformAdminFlag = Boolean(user?.isPlatformAdmin);

  const can = useCallback((perm: string) => {
    if (perm.startsWith('TENANT_')) {
      return isPlatformAdminFlag || checkPermission(permissions, perm);
    }
    return isSuperAdmin || checkPermission(permissions, perm);
  }, [isSuperAdmin, isPlatformAdminFlag, permissions]);

  const canAny = useCallback((perms: string[]) => {
    if (perms.some(p => p.startsWith('TENANT_'))) {
      return isPlatformAdminFlag || hasAnyPermission(permissions, perms);
    }
    return isSuperAdmin || hasAnyPermission(permissions, perms);
  }, [isSuperAdmin, isPlatformAdminFlag, permissions]);
  const isModuleEnabled = useCallback((mod: string) => isPlatformAdminFlag || checkModuleEnabled(modules, mod), [isPlatformAdminFlag, modules]);

  const canViewModule = useCallback((moduleName: string) => {
    if (isSuperAdmin) return true;
    const upperName = moduleName.toUpperCase();
    return permissions.some(p => {
      const upperP = String(p).toUpperCase();
      return upperP === '*' || upperP.startsWith(upperName) || upperP.includes(`_${upperName}`);
    });
  }, [permissions, isSuperAdmin]);

  const canCreate = useCallback((entity: string) => can(`${entity.toUpperCase()}_CREATE`), [can]);
  const canUpdate = useCallback((entity: string) => can(`${entity.toUpperCase()}_UPDATE`), [can]);
  const canDelete = useCallback((entity: string) => can(`${entity.toUpperCase()}_DELETE`), [can]);
  const canManage = useCallback((entity: string) => can(`${entity.toUpperCase()}_MANAGE`), [can]);

  return {
    permissions,
    modules,
    user,
    role: user?.role || null,
    can,
    canAny,
    isModuleEnabled,
    hasPermission: can,
    hasAnyPermission: canAny,
    hasAllPermissions: useCallback((perms: string[]) => isSuperAdmin || hasAllPermissions(permissions, perms), [isSuperAdmin, permissions]),
    isPlatformAdmin: isPlatformAdminFlag,
    canViewModule,
    canCreate,
    canUpdate,
    canDelete,
    canManage,
  };
}

