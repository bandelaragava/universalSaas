/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import rolesApi from '@/services/rolesApi';

interface Role {
  id: number;
  name: string;
  active: boolean;
  permissions?: string[];
}

interface Permission {
  id: number;
  permissionKey: string;
  description?: string;
  module?: string;
  active: boolean;
}

export default function RoleMapping() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedRoleId = searchParams.get('roleId');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Map Permissions State
  const [mappingRoleId, setMappingRoleId] = useState('');
  const [mappingPermissionIds, setMappingPermissionIds] = useState<number[]>([]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await rolesApi.get<Role[]>('/roles');
      setRoles(response.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Failed to fetch roles');
    }
  }, [showToast]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await rolesApi.get<Permission[]>('/permissions');
      setPermissions(response.data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const handleMappingRoleChange = useCallback((roleIdVal: string, currentRoles: Role[], currentPermissions: Permission[]) => {
    setMappingRoleId(roleIdVal);
    if (!roleIdVal) {
      setMappingPermissionIds([]);
      return;
    }
    const selectedRole = currentRoles.find((r) => r.id === parseInt(roleIdVal, 10));
    if (selectedRole && selectedRole.permissions) {
      const rolePermNames = Array.from(selectedRole.permissions);
      const matchedIds = currentPermissions
        .filter((p) => rolePermNames.includes(p.permissionKey))
        .map((p) => p.id);
      setMappingPermissionIds(matchedIds);
    } else {
      setMappingPermissionIds([]);
    }
  }, []);

  // Auto-select role when coming from Roles list with ?roleId=
  useEffect(() => {
    if (preselectedRoleId && roles.length > 0 && permissions.length > 0) {
      handleMappingRoleChange(preselectedRoleId, roles, permissions);
    }
  }, [preselectedRoleId, roles, permissions, handleMappingRoleChange]);

  const handleMapPermissionsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mappingRoleId) {
      showToast('error', 'Please select a role to map permissions.');
      return;
    }

    const payload = {
      permissionIds: mappingPermissionIds,
    };

    try {
      await rolesApi.post(`/roles/${mappingRoleId}/permissions`, payload);
      showToast('success', 'Permissions mapped to role successfully!');
      fetchRoles(); // Refresh roles list to show updated permissions
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to map permissions');
    }
  };

  const handleMappingPermissionToggle = (permId: number) => {
    setMappingPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const renderPermissionCheckboxes = (
    selectedIds: number[],
    toggleFn: (id: number) => void,
    setIdsFn: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    const grouped = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
      const mod = perm.module || 'Other';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});

    if (permissions.length === 0) {
      return (
        <div className="text-slate-500 text-sm">
          No permissions available. Please create permissions first.
        </div>
      );
    }

    return Object.keys(grouped).map((mod) => {
      const modPermIds = grouped[mod].map((p) => p.id);
      const allSelected = modPermIds.length > 0 && modPermIds.every((id) => selectedIds.includes(id));

      const toggleSelectAll = () => {
        if (allSelected) {
          setIdsFn((prev) => prev.filter((id) => !modPermIds.includes(id)));
        } else {
          setIdsFn((prev) => {
            const newIds = new Set([...prev, ...modPermIds]);
            return Array.from(newIds);
          });
        }
      };

      return (
        <div key={mod} className="mb-6 border-b border-slate-800 pb-4">
          <div className="flex justify-between items-center mb-3">
            <h6 className="text-cyan-400 font-bold text-xs uppercase tracking-wider">{mod}</h6>
            <button
              type="button"
              className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
              onClick={toggleSelectAll}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {grouped[mod].map((perm) => {
              const isChecked = selectedIds.includes(perm.id);
              return (
                <div
                  key={perm.id}
                  className={`bg-slate-950/40 p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer select-none ${
                    isChecked
                      ? 'border-cyan-500/30 bg-cyan-500/5'
                      : 'border-slate-850 hover:bg-slate-950/60'
                  }`}
                  onClick={() => {
                    if (perm.active) toggleFn(perm.id);
                  }}
                >
                  <input
                    type="checkbox"
                    id={`perm-${perm.id}`}
                    className="rounded bg-slate-955 border-slate-800 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    checked={isChecked}
                    onChange={() => {}}
                    disabled={!perm.active}
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      className={`text-sm font-semibold block truncate cursor-pointer ${
                        perm.active ? 'text-slate-200' : 'text-slate-500'
                      }`}
                      htmlFor={`perm-${perm.id}`}
                      title={`${perm.permissionKey}: ${perm.description || ''}`}
                    >
                      {perm.permissionKey}
                    </label>
                    {perm.description && (
                      <span className="text-[10px] text-slate-500 block truncate">
                        {perm.description}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  const selectedRole = roles.find((r) => String(r.id) === String(mappingRoleId));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              onClick={() => navigate('/roles')}
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Roles
            </button>
          </div>
          <h2 className="text-2xl font-bold text-slate-50 tracking-tight">
            Map Permissions
            {selectedRole && (
              <span className="text-cyan-400 font-semibold ms-2">→ {selectedRole.name}</span>
            )}
          </h2>
        </div>
      </div>

      {/* Floating Toast Alerts */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-305 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleMapPermissionsSubmit} className="space-y-6">
        {/* Role Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Role
          </label>
          <select
            className="w-full max-w-md bg-slate-955 border border-slate-850 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            value={mappingRoleId}
            onChange={(e) => handleMappingRoleChange(e.target.value, roles, permissions)}
            required
          >
            <option value="">- Choose a Role -</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id} disabled={!r.active}>
                {r.name} {!r.active ? '(Disabled)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Permission Grid */}
        {mappingRoleId && (
          <div className="bg-slate-905 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-3">
              Role Permissions Mapping
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {mappingPermissionIds.length} selected
              </span>
            </h3>
            <div className="border-t border-slate-800 pt-4">
              {renderPermissionCheckboxes(
                mappingPermissionIds,
                handleMappingPermissionToggle,
                setMappingPermissionIds
              )}
            </div>
          </div>
        )}

        {/* Sticky Footer Form Action */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-850 p-4 rounded-2xl flex justify-end gap-3 sticky bottom-4 z-20">
          <button
            type="button"
            className="px-6 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-sm font-semibold transition-colors"
            onClick={() => navigate('/roles')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-600/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!mappingRoleId}
          >
            Save Permissions Map
          </button>
        </div>
      </form>
    </div>
  );
}




