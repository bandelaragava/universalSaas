// /* eslint-disable react-refresh/only-export-components */
// /* eslint-disable react-hooks/set-state-in-effect */
// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import rolesApi from '@/services/rolesApi';
// import { useAppStore } from '@/store/useAppStore';

// export interface User {
//   id: string | number;
//   email: string;
//   tenantId: number;
//   tenantCode: string;
//   isPlatformAdmin: boolean;
//   role?: string;
// }

// interface AuthContextValue {
//   token: string | null;
//   user: User | null;
//   permissions: string[];
//   modules: string[];
//   loading: boolean;
//   login: (newToken: string, newPermissions: string[], newModules: string[], newTenantCode?: string, newRole?: string) => void;
//   logout: () => void;
//   isAuthenticated: boolean;
//   isPlatformAdmin: boolean;
// }

// const AuthContext = createContext<AuthContextValue | null>(null);

// const parseToken = (jwtToken: string | null): User | null => {
//   if (!jwtToken) return null;
//   try {
//     const payload = JSON.parse(atob(jwtToken.split('.')[1]));
//     const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
//     const role = payload.role || payload.roleName || storedRole || 'STAFF';
//     const isPlatformAdmin = Boolean(payload.isPlatformAdmin);
//     return {
//       id: payload.id || payload.userId,
//       email: payload.sub,
//       tenantId: payload.tenantId,
//       tenantCode: payload.tenantCode,
//       isPlatformAdmin,
//       role,
//     };
//   } catch {
//     return null;
//   }
// };

// const clearStorage = () => {
//   localStorage.removeItem('token');
//   localStorage.removeItem('permissions');
//   localStorage.removeItem('modules');
//   localStorage.removeItem('tenantCode');
//   localStorage.removeItem('role');
// };

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [token, setToken] = useState<string | null>(() => {
//     if (typeof window === 'undefined') return null;
//     const storedToken = localStorage.getItem('token');
//     if (storedToken && !parseToken(storedToken)) {
//       clearStorage();
//       return null;
//     }
//     return storedToken;
//   });

//   const [user, setUser] = useState<User | null>(() => {
//     if (typeof window === 'undefined') return null;
//     const storedToken = localStorage.getItem('token');
//     return parseToken(storedToken);
//   });

//   const [permissions, setPermissions] = useState<string[]>(() => {
//     if (typeof window === 'undefined') return [];
//     const storedToken = localStorage.getItem('token');
//     const parsedUser = storedToken ? parseToken(storedToken) : null;
//     if (!storedToken || !parsedUser) return [];


//     const storedPermissions = localStorage.getItem('permissions');
//     try {
//       return JSON.parse(storedPermissions || '[]');
//     } catch {
//       return [];
//     }
//   });

//   const [modules, setModules] = useState<string[]>(() => {
//     if (typeof window === 'undefined') return [];
//     const storedToken = localStorage.getItem('token');
//     const parsedUser = storedToken ? parseToken(storedToken) : null;
//     if (!storedToken || !parsedUser) return [];


//     const storedModules = localStorage.getItem('modules');
//     try {
//       return JSON.parse(storedModules || '[]');
//     } catch {
//       return [];
//     }
//   });

//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let isMounted = true;

//     const syncCurrentUser = async () => {
//       if (!token) {
//         if (isMounted) setLoading(false);
//         return;
//       }

//       try {
//         const res = await rolesApi.post<{ id: string | number; email?: string; role?: string; permissions?: string[] }>('/users/me');
//         if (!isMounted) return;

//         const nextPermissions = Array.isArray(res.data?.permissions) ? res.data.permissions : [];
//         setPermissions(nextPermissions);
//         localStorage.setItem('permissions', JSON.stringify(nextPermissions));

//         if (res.data?.role) {
//           localStorage.setItem('role', res.data.role);
//           setUser((prev) => (prev ? { ...prev, role: res.data.role } : prev));
//         }
//       } catch {
//         // Keep the permissions loaded from the token/localStorage when the
//         // profile sync is temporarily unavailable.
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     };

//     syncCurrentUser();

//     return () => {
//       isMounted = false;
//     };
//   }, [token]);

//   const login = (newToken: string, newPermissions: string[], newModules: string[], newTenantCode?: string, newRole?: string) => {
//     // Prevent state leakage by clearing existing session data before writing new details
//     clearStorage();
//     try {
//       useAppStore.getState().logout();
//     } catch (e) {
//       console.warn('Zustand store reset failed:', e);
//     }

//     let finalPermissions = newPermissions;
//     let finalModules = newModules;

//     // Set role in storage first so that parseToken or other functions can rely on it if necessary,
//     // although parseToken now prioritizes the decrypted token payload.
//     if (newRole) {
//       localStorage.setItem('role', newRole);
//     } else {
//       localStorage.removeItem('role');
//     }

//     const parsedUser = parseToken(newToken);
//     localStorage.setItem('token', newToken);
//     localStorage.setItem('permissions', JSON.stringify(finalPermissions));
//     localStorage.setItem('modules', JSON.stringify(finalModules));

//     const tenantCode = newTenantCode || parsedUser?.tenantCode;

//     if (tenantCode) {
//       localStorage.setItem('tenantCode', tenantCode.toUpperCase());
//     } else {
//       localStorage.removeItem('tenantCode');
//     }

//     setToken(newToken);
//     setUser(parsedUser);
//     setPermissions(finalPermissions);
//     setModules(finalModules);
//   };

//   const logout = () => {
//     clearStorage();
//     try {
//       useAppStore.getState().logout();
//     } catch (e) {
//       console.warn('Zustand store logout failed:', e);
//     }
//     setToken(null);
//     setUser(null);
//     setPermissions([]);
//     setModules([]);
//   };

//   const value: AuthContextValue = {
//     token,
//     user,
//     permissions,
//     modules,
//     loading,
//     login,
//     logout,
//     isAuthenticated: !!token,
//     isPlatformAdmin: user?.isPlatformAdmin ?? false,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import rolesApi from '@/services/rolesApi'
import { useAppStore } from '@/store/useAppStore'

export interface User {
  id: string | number
  email: string
  tenantId: number
  tenantCode: string
  isPlatformAdmin: boolean
  role?: string
}

interface AuthContextValue {
  token: string | null
  user: User | null
  permissions: string[]
  modules: string[]
  loading: boolean
  login: (
    newToken: string,
    newPermissions: string[],
    newModules: string[],
    newTenantCode?: string,
    newRole?: string
  ) => void
  logout: () => void
  isAuthenticated: boolean
  isPlatformAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const parseToken = (jwtToken: string | null): User | null => {
  if (!jwtToken) return null

  try {
    const payload = JSON.parse(atob(jwtToken.split('.')[1]))
    const storedRole =
      typeof window !== 'undefined' ? localStorage.getItem('role') : null

    const role = payload.role || payload.roleName || storedRole || 'STAFF'

    return {
      id: payload.id || payload.userId || payload.sub,
      email: payload.sub,
      tenantId: payload.tenantId || payload.tenant_id,
      tenantCode: payload.tenantCode || payload.tenant_code,
      isPlatformAdmin: Boolean(payload.isPlatformAdmin || payload.is_platform_admin),
      role,
    }
  } catch {
    return null
  }
}

const readJsonArray = (key: string): string[] => {
  try {
    const value = localStorage.getItem(key)
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const normalizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

const clearStorage = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('permissions')
  localStorage.removeItem('modules')
  localStorage.removeItem('tenantCode')
  localStorage.removeItem('role')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null

    const storedToken = localStorage.getItem('token')

    if (storedToken && !parseToken(storedToken)) {
      clearStorage()
      return null
    }

    return storedToken
  })

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null

    const storedToken = localStorage.getItem('token')
    return parseToken(storedToken)
  })

  const [permissions, setPermissions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []

    const storedToken = localStorage.getItem('token')
    const parsedUser = storedToken ? parseToken(storedToken) : null

    if (!storedToken || !parsedUser) return []

    return readJsonArray('permissions')
  })

  const [modules, setModules] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []

    const storedToken = localStorage.getItem('token')
    const parsedUser = storedToken ? parseToken(storedToken) : null

    if (!storedToken || !parsedUser) return []

    return readJsonArray('modules')
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const syncCurrentUser = async () => {
      if (!token) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        const res = await rolesApi.get<{
          id?: string | number
          userId?: string | number
          email?: string
          role?: string
          roleName?: string
          permissions?: string[]
          modules?: string[]
          tenantCode?: string
          tenantId?: number
          isPlatformAdmin?: boolean
        }>('/users/me', { ignore403: true })

        if (!isMounted) return

        // Temporarily disable overriding permissions/modules from /users/me
        // Use only login response permissions and modules
        // if (Array.isArray(res.data?.permissions)) {
        //   const nextPermissions = normalizeArray(res.data.permissions)
        //   setPermissions(nextPermissions)
        //   localStorage.setItem('permissions', JSON.stringify(nextPermissions))
        // }

        // if (Array.isArray(res.data?.modules)) {
        //   const nextModules = normalizeArray(res.data.modules)
        //   setModules(nextModules)
        //   localStorage.setItem('modules', JSON.stringify(nextModules))
        // }

        const nextRole = res.data?.role || res.data?.roleName

        if (nextRole) {
          localStorage.setItem('role', nextRole)
        }

        setUser((prev) => {
          if (!prev) return prev

          return {
            ...prev,
            id: res.data?.id || res.data?.userId || prev.id,
            email: res.data?.email || prev.email,
            tenantId: res.data?.tenantId || prev.tenantId,
            tenantCode: res.data?.tenantCode || prev.tenantCode,
            role: nextRole || prev.role,
            isPlatformAdmin: Boolean(res.data?.isPlatformAdmin),
          }
        })
      } catch {
        // Keep login/localStorage permissions and modules when /users/me is unavailable.
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    syncCurrentUser()

    return () => {
      isMounted = false
    }
  }, [token])

  const login = (
    newToken: string,
    newPermissions: string[],
    newModules: string[],
    newTenantCode?: string,
    newRole?: string
  ) => {
    clearStorage()

    try {
      useAppStore.getState().logout()
    } catch (error) {
      console.warn('Zustand store reset failed:', error)
    }

    const finalPermissions = normalizeArray(newPermissions)
    const finalModules = normalizeArray(newModules)

    if (newRole) {
      localStorage.setItem('role', newRole)
    }

    const parsedUser = parseToken(newToken)

    localStorage.setItem('token', newToken)
    localStorage.setItem('permissions', JSON.stringify(finalPermissions))
    localStorage.setItem('modules', JSON.stringify(finalModules))

    const tenantCode = newTenantCode || parsedUser?.tenantCode

    if (tenantCode) {
      localStorage.setItem('tenantCode', tenantCode.toUpperCase())
    }

    setToken(newToken)
    setUser(parsedUser)
    setPermissions(finalPermissions)
    setModules(finalModules)
    setLoading(false)
  }

  const logout = () => {
    clearStorage()

    try {
      useAppStore.getState().logout()
    } catch (error) {
      console.warn('Zustand store logout failed:', error)
    }

    setToken(null)
    setUser(null)
    setPermissions([])
    setModules([])
    setLoading(false)
  }

  const value: AuthContextValue = {
    token,
    user,
    permissions,
    modules,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
    isPlatformAdmin: Boolean(user?.isPlatformAdmin),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
