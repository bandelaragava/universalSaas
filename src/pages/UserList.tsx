import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, UserMinus, UserCheck, Edit2, Hash } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import { usePermissions } from '@/auth/usePermissions';
import EntityListPage from '@/components/shared/EntityListPage';
import Modal from '@/components/ui/Modal';
import UserForm from '@/pages/UserForm';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  active: boolean;
  roleId?: number;
  roleName?: string;
  supervisorUserId?: number;
  supervisorName?: string;
  employeeId?: string;
  leadId?: string;
  profileData?: Record<string, unknown>;
}

export default function UserList() {
  const { hasPermission } = usePermissions();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.get<User[]>('/users', { signal });
      setUsers(res.data);
    } catch (err: unknown) {
      const axiosError = err as { name?: string; response?: { data?: { message?: string } }; message?: string };
      if (axiosError.name === 'CanceledError') return;
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchUsers(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchUsers]);

  const handleDeactivate = async (user: User) => {
    if (!hasPermission('USER_UPDATE')) {
      showToast('error', 'Unauthorized: You do not have permission to modify users.');
      return;
    }
    const action = user.active ? 'deactivate' : 're-activate';
    try {
      await rolesApi.patch(`/users/${user.id}/toggle-active`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
      );
      showToast('success', `User ${action}d successfully.`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Action failed.');
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!hasPermission('USER_UPDATE')) {
      showToast('error', 'Unauthorized: You do not have permission to modify users.');
      return;
    }
    showToast(
      'success',
      `Password reset initiated for ${user.firstName}. OTP flow will be implemented in next sprint.`
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.firstName, u.lastName, u.email, u.roleName]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [users, search]);

  const initials = (u: User) =>
    ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
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

      <EntityListPage
        title="Users"
        description="Manage all system users, roles, and supervisor mapping across your organisation."
        addLabel={hasPermission('USER_CREATE') ? '+ Add User' : undefined}
        onAdd={() => {
          setEditingUserId(null);
          setIsFormOpen(true);
        }}
        headerActions={
          <Link
            to="/settings/id-generation"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Hash className="w-3.5 h-3.5 text-primary" />
            ID Formats
          </Link>
        }
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filtered.length : undefined}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">User ID</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Role & Designation</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Work Mode</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Joining Date</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Reports To</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[240px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    {search ? `No users matching "${search}"` : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border text-foreground hover:bg-muted/30 transition-colors ${
                      !user.active ? 'opacity-50' : ''
                    }`}
                  >
                    {/* User ID */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {user.employeeId || user.leadId || (user.id ? `EMP-${String(user.id).padStart(4, '0')}` : `#USR-${user.id}`)}
                      </span>
                    </td>

                    {/* Avatar & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                            user.active
                              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {initials(user)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground block leading-tight">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-muted-foreground">{user.email}</td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <div>
                        {user.roleName ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                            <Shield className="w-3.5 h-3.5" />
                            {user.roleName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {!!user.profileData?.designation && (
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium block mt-1 uppercase tracking-wider">
                            {String(user.profileData.designation).replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Work Mode */}
                    <td className="py-3.5 px-4">
                      {user.profileData?.work_mode ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                            user.profileData.work_mode === 'work_from_home'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {user.profileData.work_mode === 'work_from_home' ? 'WFH' : 'Office'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Joining Date */}
                    <td className="py-3.5 px-4 text-muted-foreground text-xs font-mono">
                      {user.profileData?.joining_date ? String(user.profileData.joining_date) : <span className="text-muted-foreground">-</span>}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          user.active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                        }`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Reports To */}
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">
                      {user.supervisorName || <span className="text-muted-foreground">-</span>}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-3">
                        {hasPermission('USER_UPDATE') && (
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 font-semibold text-xs transition-colors ${
                              !user.active
                                ? 'text-muted-foreground/50 cursor-not-allowed'
                                : 'text-primary hover:text-primary/80'
                            }`}
                            onClick={() => {
                              if (user.active) {
                                setEditingUserId(user.id);
                                setIsFormOpen(true);
                              }
                            }}
                            disabled={!user.active}
                            title={!user.active ? 'Cannot edit inactive user' : 'Edit user info'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                        {user.roleName === 'SUPER_ADMIN' ? (
                          <span className="bg-muted text-muted-foreground text-[10px] uppercase font-semibold px-2 py-1 rounded border border-border">
                            Protected
                          </span>
                        ) : (
                          <>
                            {hasPermission('USER_UPDATE') && (
                              <button
                                type="button"
                                className={`inline-flex items-center gap-1 font-semibold text-xs transition-colors ${
                                  user.active
                                    ? 'text-amber-600 dark:text-amber-500 hover:opacity-85'
                                    : 'text-emerald-600 dark:text-emerald-500 hover:opacity-85'
                                }`}
                                onClick={() => handleDeactivate(user)}
                              >
                                {user.active ? (
                                  <>
                                    <UserMinus className="w-3.5 h-3.5" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    Activate
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        )}
                        {hasPermission('USER_UPDATE') && (
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 font-semibold text-xs transition-colors ${
                              !user.active
                                ? 'text-muted-foreground/50 cursor-not-allowed'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => user.active && handleResetPassword(user)}
                            disabled={!user.active}
                            title={
                              !user.active
                                ? 'Cannot reset password for inactive user'
                                : 'Trigger credential reset'
                            }
                          >
                            <Key className="w-3.5 h-3.5" />
                            Reset
                          </button>
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

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingUserId ? "Modify Personnel Profile" : "Onboard New Identity"}
        size="3xl"
      >
        <UserForm
          userId={editingUserId}
          onClose={() => {
            setIsFormOpen(false);
            fetchUsers();
          }}
        />
      </Modal>
    </div>
  );
}




