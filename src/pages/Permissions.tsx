import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { usePermissions } from '@/auth/usePermissions';

interface Permission {
  id: number;
  module: string;
  action: string;
  permissionKey: string;
  description: string;
  active: boolean;
}

export default function Permissions() {
  const { hasPermission } = usePermissions();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      const response = await rolesApi.get<Permission[]>('/permissions');
      setPermissions(response.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch permissions');
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggleStatus = async (permission: Permission) => {
    setMessage(null);
    setError(null);
    try {
      if (permission.active) {
        await rolesApi.put(`/permissions/${permission.id}/disable`);
        setMessage(`Permission '${permission.permissionKey}' disabled successfully!`);
      } else {
        await rolesApi.put(`/permissions/${permission.id}/enable`);
        setMessage(`Permission '${permission.permissionKey}' enabled successfully!`);
      }
      fetchPermissions();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">System Permissions</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review and toggle system permission nodes to restrict or grant access to various resources.
        </p>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="font-semibold text-foreground">Permissions Registry</h3>
          <button
            onClick={fetchPermissions}
            className="text-xs bg-muted hover:bg-muted/80 text-foreground border border-border rounded px-2.5 py-1.5 transition-colors font-semibold"
          >
            Refresh List
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Module</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Action</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Permission Key</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                {hasPermission('ROLE_UPDATE') && <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {permissions.length === 0 ? (
                <tr>
                  <td colSpan={hasPermission('ROLE_UPDATE') ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    No permissions found.
                  </td>
                </tr>
              ) : (
                permissions.map((perm) => (
                  <tr
                    key={perm.id}
                    className={`border-b border-border text-foreground hover:bg-muted/30 transition-colors ${
                      !perm.active ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground/80">{perm.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-muted text-foreground px-2 py-0.5 rounded text-xs border border-border">
                        {perm.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded text-xs border border-cyan-500/20">
                        {perm.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-foreground font-semibold">{perm.permissionKey}</strong>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">{perm.description || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          perm.active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                        }`}
                      >
                        {perm.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    {hasPermission('ROLE_UPDATE') && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(perm)}
                          className={`font-semibold text-xs border rounded-lg px-3 py-1 transition-colors ${
                            perm.active
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {perm.active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}




