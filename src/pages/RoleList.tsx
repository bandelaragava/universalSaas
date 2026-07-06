/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import rolesApi from '@/services/rolesApi';
import { usePermissions } from '@/auth/usePermissions';
import EntityListPage from '@/components/shared/EntityListPage';

interface Role {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  permissions?: string[];
}

export default function RoleList() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchRoles = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.get<Role[]>('/roles', { signal });
      setRoles(res.data);
    } catch (err: unknown) {
      const axiosError = err as { name?: string; response?: { data?: { message?: string } }; message?: string };
      if (axiosError.name === 'CanceledError') return;
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetchRoles(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggle = async (role: Role) => {
    try {
      if (role.active) {
        await rolesApi.put(`/roles/${role.id}/disable`);
      } else {
        await rolesApi.put(`/roles/${role.id}/enable`);
      }
      setRoles((prev) =>
        prev.map((r) => (r.id === role.id ? { ...r, active: !r.active } : r))
      );
      showToast('success', `Role "${role.name}" ${role.active ? 'disabled' : 'enabled'}.`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Action failed');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? roles.filter((r) =>
          [r.name, r.description].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
        )
      : roles;
  }, [roles, search]);

  return (
    <div className="relative">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {toast.msg}
        </div>
      )}
      <EntityListPage
        title="Roles"
        description="Manage roles and their permissions"
        addLabel={hasPermission('ROLE_CREATE') ? '+ Add Role' : undefined}
        addRoute="/roles/create"
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filtered.length : undefined}
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="pl-6 pr-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Role Name</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Description</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-36">Permissions</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-28">Status</th>
                <th className="pl-4 pr-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                    {search ? `No roles matching "${search}"` : 'No roles found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((role) => (
                  <tr
                    key={role.id}
                    className={`border-b border-slate-800/60 hover:bg-slate-900/20 transition-colors ${
                      !role.active ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="pl-6 pr-4 py-4">
                      <div className="font-semibold text-slate-200">{role.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">#{role.id}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-sm">
                      {role.description || '-'}
                    </td>
                    <td className="px-4 py-4">
                      {role.permissions && role.permissions.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          {role.permissions.length} mapped
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">None</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          role.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-slate-800 text-slate-400 border-slate-700/60'
                        }`}
                      >
                        {role.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="pl-4 pr-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-3">
                        {hasPermission('ROLE_UPDATE') && (
                          <button
                            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                            onClick={() => navigate(`/roles/edit/${role.id}`)}
                          >
                            Edit
                          </button>
                        )}
                        {role.name !== 'SUPER_ADMIN' ? (
                          hasPermission('ROLE_UPDATE') && (
                            <button
                              className={`text-sm font-medium transition-colors ${
                                role.active
                                  ? 'text-amber-500 hover:text-amber-400'
                                  : 'text-emerald-500 hover:text-emerald-400'
                              }`}
                              onClick={() => handleToggle(role)}
                            >
                              {role.active ? 'Disable' : 'Enable'}
                            </button>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </EntityListPage>
    </div>
  );
}




