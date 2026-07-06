/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { usePermissions } from '@/auth/usePermissions';

interface HierarchyLink {
  id: number;
  roleId: number;
  roleName: string;
  roleCode: string;
  reportsToRoleId: number;
  reportsToRoleName: string;
  reportsToRoleCode: string;
}

interface Role {
  id: number;
  name: string;
  code?: string;
  active: boolean;
}

export default function RoleHierarchy() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyLink[]>([]);
  const [childRoleId, setChildRoleId] = useState('');
  const [parentRoleId, setParentRoleId] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const { hasPermission } = usePermissions();
  const canManage = hasPermission('ROLE_UPDATE');

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHierarchy = async (signal?: AbortSignal) => {
    try {
      const res = await rolesApi.get<HierarchyLink[]>('/roles/hierarchy', { signal });
      setHierarchy(res.data);
    } catch (err: unknown) {
      const axiosError = err as { name?: string };
      if (axiosError.name === 'CanceledError') return;
      console.error('Error fetching hierarchy:', err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchRoles = async () => {
      try {
        const res = await rolesApi.get<Role[]>('/roles', { signal: controller.signal });
        setRoles(res.data.filter((r) => r.active));
      } catch (err: unknown) {
        const axiosError = err as { name?: string };
        if (axiosError.name === 'CanceledError') return;
        console.error('Error fetching roles:', err);
      }
    };

    fetchRoles();
    fetchHierarchy(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!childRoleId || !parentRoleId) {
      showToast('error', 'Please select both roles.');
      return;
    }
    if (childRoleId === parentRoleId) {
      showToast('error', 'A role cannot report to itself.');
      return;
    }
    setLoading(true);
    try {
      await rolesApi.post(`/roles/hierarchy?roleId=${childRoleId}&reportsToRoleId=${parentRoleId}`);
      showToast('success', 'Hierarchy link added successfully!');
      setChildRoleId('');
      setParentRoleId('');
      fetchHierarchy();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Failed to add link');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: number, reportsToRoleId: number) => {
    try {
      await rolesApi.delete(`/roles/hierarchy?roleId=${roleId}&reportsToRoleId=${reportsToRoleId}`);
      showToast('success', 'Hierarchy link removed.');
      fetchHierarchy();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Failed to remove link');
    }
  };

  // Build a tree structure for visual display
  const buildTree = () => {
    const childIds = new Set(hierarchy.map((h) => h.roleId));
    const topLevelRoles = roles.filter((r) => !childIds.has(r.id));

    const getChildren = (roleId: number) => hierarchy.filter((h) => h.reportsToRoleId === roleId);

    const renderNode = (role: Role, depth = 0, path = new Set<number>()): React.ReactNode => {
      if (path.has(role.id)) {
        return (
          <div key={`cycle-${role.id}-${depth}`} style={{ marginLeft: depth * 24 }} className="mt-1">
            <span className="text-rose-500 text-xs font-semibold px-2 py-1 bg-rose-500/10 rounded-md border border-rose-500/20">
              ⚠️ Circular Reference: {role.name}
            </span>
          </div>
        );
      }
      
      const currentPath = new Set(path);
      currentPath.add(role.id);

      const children = getChildren(role.id);
      return (
        <div key={`${role.id}-${depth}`} style={{ marginLeft: depth * 24 }} className="mt-1">
          <div
            className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg border text-sm font-medium ${
              depth === 0
                ? 'bg-cyan-600 border-cyan-700 text-white'
                : depth === 1
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            style={{ minWidth: 200 }}
          >
            <span>
              {depth > 0 && <span className="mr-1.5 text-slate-500">↳</span>}
              {role.code && (
                <span className="bg-slate-950/60 text-slate-400 px-1.5 py-0.5 rounded text-[10px] mr-1.5 border border-slate-800">
                  {role.code}
                </span>
              )}
              {role.name}
            </span>
          </div>
          {children.map((link) => {
            const childRole = roles.find((r) => r.id === link.roleId);
            if (!childRole) return null;
            return <React.Fragment key={link.id}>{renderNode(childRole, depth + 1, currentPath)}</React.Fragment>;
          })}
        </div>
      );
    };

    return topLevelRoles.map((r) => renderNode(r, 0));
  };

  return (
    <div className="space-y-6">
      {/* ── Floating Toast Alerts ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-455'
          }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-50 tracking-tight">Role Reporting Hierarchy</h2>
        <p className="text-slate-400 text-sm mt-1">
          Define reporting connections between access levels. This structures chain of command workflow verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add Link Form */}
        {canManage && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-3">
              Add Hierarchy Link
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Child Role <span className="text-slate-500">(reports to)</span>
                </label>
                <select
                  className="w-full bg-background border border-slate-850 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={childRoleId}
                  onChange={(e) => setChildRoleId(e.target.value)}
                  required
                >
                  <option value="">-- Select Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.code ? `(${r.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Reports To <span className="text-slate-505">(supervisor role)</span>
                </label>
                <select
                  className="w-full bg-background border border-slate-850 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={parentRoleId}
                  onChange={(e) => setParentRoleId(e.target.value)}
                  required
                >
                  <option value="">-- Select Role --</option>
                  {roles
                    .filter((r) => r.id !== parseInt(childRoleId, 10))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.code ? `(${r.code})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full font-semibold py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving…' : '+ Add Link'}
              </button>
            </form>
          </div>
        )}

        {/* Right: Hierarchy tree & flat list */}
        <div className={canManage ? 'lg:col-span-8 space-y-6' : 'lg:col-span-12 space-y-6'}>
          {/* Visual tree */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-3 mb-4">
              Reporting Chain (Visual)
            </h3>
            {roles.length === 0 ? (
              <span className="text-slate-500 text-sm">No roles configured.</span>
            ) : (
              <div className="overflow-x-auto py-2">{buildTree()}</div>
            )}
          </div>

          {/* Flat list of all links */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-3 mb-4">
              All Hierarchy Connections
            </h3>
            {hierarchy.length === 0 ? (
              <p className="text-slate-500 text-sm mb-0">No hierarchy connections built yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/20 text-slate-400">
                      <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Role</th>
                      <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Reports To</th>
                      {canManage && (
                        <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-right w-24">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {hierarchy.map((h) => (
                      <tr key={h.id} className="border-b border-slate-800/50 text-slate-300">
                        <td className="py-3 px-3">
                          {h.roleCode && (
                            <span className="bg-background text-slate-400 px-1.5 py-0.5 rounded text-[10px] mr-1.5 border border-slate-800">
                              {h.roleCode}
                            </span>
                          )}
                          <span className="font-medium text-slate-200">{h.roleName}</span>
                        </td>
                        <td className="py-3 px-3">
                          {h.reportsToRoleCode && (
                            <span className="bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded text-[10px] mr-1.5 border border-cyan-900/40">
                              {h.reportsToRoleCode}
                            </span>
                          )}
                          <span className="font-medium text-slate-200">{h.reportsToRoleName}</span>
                        </td>
                        {canManage && (
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              className="text-rose-455 hover:text-rose-400 font-medium text-xs bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded px-2.5 py-1 transition-colors"
                              onClick={() => handleDelete(h.roleId, h.reportsToRoleId)}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




