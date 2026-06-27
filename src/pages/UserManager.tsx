/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Key, Trash2, Edit2, UserPlus, Users } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import { usePermissions } from '@/auth/usePermissions';
import EntityPage from '@/components/shared/EntityPage';

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

interface Role {
  id: number;
  name: string;
  active: boolean;
}

interface Supervisor {
  id: number;
  name: string;
}

interface ExtraField {
  id: number;
  fieldName: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DROPDOWN' | string;
  required: boolean;
  options?: string[];
}

export default function UserManager() {
  const { hasPermission } = usePermissions();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('MALE');
  const [profileData, setProfileData] = useState<Record<string, unknown>>({});
  const [dynamicFields, setDynamicFields] = useState<ExtraField[]>([]);
  const [supervisorUserId, setSupervisorUserId] = useState('');
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Employee profile fields
  const [employeeId, setEmployeeId] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeType, setEmployeeType] = useState('regular');
  const [designation, setDesignation] = useState('software_engineer');
  const [workMode, setWorkMode] = useState('office');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await rolesApi.get<User[]>('/users', { signal });
      setUsers(response.data);
    } catch (err: unknown) {
      const axiosError = err as { name?: string; response?: { data?: { message?: string } }; message?: string };
      if (axiosError.name === 'CanceledError') return;
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchRoles = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await rolesApi.get<Role[]>('/roles', { signal });
      setRoles(response.data.filter((r) => r.active));
    } catch (err: unknown) {
      const axiosError = err as { name?: string };
      if (axiosError.name === 'CanceledError') return;
      console.error('Error fetching roles:', err);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    fetchRoles(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchUsers, fetchRoles]);

  // Handle dynamic field changes on selected role change
  useEffect(() => {
    if (!selectedRoleId) {
      setDynamicFields([]);
      setSupervisors([]);
      return;
    }

    const controller = new AbortController();

    const fetchExtraFields = async () => {
      try {
        const response = await rolesApi.get<ExtraField[]>(`/roles/${selectedRoleId}/extra-fields`, {
          signal: controller.signal,
        });
        setDynamicFields(response.data);
      } catch (err: unknown) {
        const axiosError = err as { name?: string };
        if (axiosError.name === 'CanceledError') return;
        setDynamicFields([]);
      }
    };

    const fetchSupervisors = async () => {
      try {
        const response = await rolesApi.get<Supervisor[]>(`/users/supervisors?roleId=${selectedRoleId}`, {
          signal: controller.signal,
        });
        setSupervisors(response.data || []);
      } catch (err: unknown) {
        const axiosError = err as { name?: string };
        if (axiosError.name === 'CanceledError') return;
        setSupervisors([]);
      }
    };

    fetchExtraFields();
    fetchSupervisors();

    return () => {
      controller.abort();
    };
  }, [selectedRoleId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast('error', 'First name, last name, and email are required');
      return;
    }
    if (!/^[a-zA-Z0-9.\-_]+@gmail\.com$/.test(email)) {
      showToast('error', 'Email must be a valid Gmail address');
      return;
    }
    if (!editingId && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(password)) {
      showToast('error', 'Password must include one uppercase, one lowercase, one digit, and one special char');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      showToast('error', 'Phone number must be exactly 10 digits');
      return;
    }

    const payload = {
      firstName,
      lastName,
      email,
      password: editingId ? undefined : password,
      phoneNumber,
      gender,
      roleId: selectedRoleId ? parseInt(selectedRoleId, 10) : null,
      supervisorUserId: supervisorUserId ? parseInt(supervisorUserId, 10) : null,
      employeeId: employeeId || null,
      profileData: {
        ...profileData,
        emp_code: empCode || employeeId,
        joining_date: joiningDate,
        employee_type: employeeType,
        designation: designation,
        work_mode: workMode,
        date_of_birth: dateOfBirth,
        address: address,
      },
    };

    try {
      if (editingId) {
        await rolesApi.put(`/users/${editingId}`, payload);
        showToast('success', 'User profile updated successfully!');
      } else {
        await rolesApi.post('/users', payload);
        showToast('success', 'User onboarded successfully!');
      }

      // Reset Form State
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
      setSelectedRoleId('');
      setSupervisorUserId('');
      setGender('MALE');
      setProfileData({});
      setDynamicFields([]);
      setSupervisors([]);
      setEmployeeId('');
      setEmpCode('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setEmployeeType('regular');
      setDesignation('software_engineer');
      setWorkMode('office');
      setDateOfBirth('');
      setAddress('');
      setEditingId(null);
      setIsDrawerOpen(false);

      fetchUsers();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: any }; message?: string };
      let errorMsg = 'Save failed.';
      if (axiosError.response) {
        if (typeof axiosError.response.data === 'object') {
          if (axiosError.response.data.errors) {
            errorMsg = Object.values(axiosError.response.data.errors).join(' | ');
          } else if (axiosError.response.data.message) {
            errorMsg = axiosError.response.data.message;
          }
        } else if (typeof axiosError.response.data === 'string') {
          errorMsg = axiosError.response.data;
        }
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
      showToast('error', errorMsg);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setPassword('');
    setPhoneNumber(user.phoneNumber || '');
    setSelectedRoleId(user.roleId ? String(user.roleId) : '');
    setSupervisorUserId(user.supervisorUserId ? String(user.supervisorUserId) : '');
    setGender(user.gender || 'MALE');
    setEmployeeId(user.employeeId || '');

    const pd = user.profileData || {};
    setProfileData(pd);
    setEmpCode(String(pd.emp_code || user.employeeId || ''));
    setJoiningDate(String(pd.joining_date || new Date().toISOString().split('T')[0]));
    setEmployeeType(String(pd.employee_type || 'regular'));
    setDesignation(String(pd.designation || 'software_engineer'));
    setWorkMode(String(pd.work_mode || 'office'));
    setDateOfBirth(String(pd.date_of_birth || ''));
    setAddress(String(pd.address || ''));

    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await rolesApi.delete(`/users/${id}`);
      showToast('success', 'User profile deleted successfully!');
      fetchUsers();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Deletion failed');
    }
  };

  const handleResetPassword = async (id: number, name: string) => {
    const newPassword = prompt(`Enter new password for ${name} (minimum 8 characters):`);
    if (!newPassword) return;

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      await rolesApi.post(`/users/${id}/reset-password`, { newPassword });
      alert(`Password successfully reset for ${name}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      alert('Error resetting password: ' + (axiosError.response?.data?.message || axiosError.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setSelectedRoleId('');
    setSupervisorUserId('');
    setGender('MALE');
    setProfileData({});
    setDynamicFields([]);
    setSupervisors([]);
    setEmployeeId('');
    setEmpCode('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setEmployeeType('regular');
    setDesignation('software_engineer');
    setWorkMode('office');
    setDateOfBirth('');
    setAddress('');
  };

  const handleDynamicChange = (fieldName: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const filteredUsers = users;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450'
            }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      <EntityPage
        title="User Workspace Manager"
        addButtonLabel={hasPermission('USER_CREATE') ? 'Add User' : undefined}
        onAddClick={() => {
          handleCancelEdit();
          setIsDrawerOpen(true);
        }}
        isDrawerOpen={isDrawerOpen}
        closeDrawer={() => setIsDrawerOpen(false)}
        drawerTitle={editingId ? 'Edit Workspace Profile' : 'Onboard User to Workspace'}
        table={
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="py-3 px-4 font-semibold text-[10px] uppercase tracking-wider">ID</th>
                  <th className="py-3 px-4 font-semibold text-[10px] uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 font-semibold text-[10px] uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 font-semibold text-[10px] uppercase tracking-wider">Role & Designation</th>
                  <th className="py-3 px-4 font-semibold text-[10px] uppercase tracking-wider">Work Mode</th>
                  <th className="py-3 px-4 font-semibold text-[10px] uppercase tracking-wider">Joining Date</th>
                  <th className="py-3 px-4 font-semibold text-[10px] uppercase tracking-wider">Reports To</th>
                  <th className="py-3 px-4 font-semibold text-[10px] uppercase tracking-wider text-right w-[240px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                        <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        Loading user workspace...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No user configurations found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border text-foreground hover:bg-muted/30 transition-colors ${!user.active ? 'opacity-50' : ''
                        }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                        {user.leadId || user.employeeId || `USR-${user.id}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3.5 px-4">
                        <div>
                          {user.roleName ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                              <Shield className="w-3.5 h-3.5" />
                              {user.roleName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                          {!!user.profileData?.designation && (
                            <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-medium block mt-1 uppercase tracking-wider">
                              {String(user.profileData.designation).replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Work Mode */}
                      <td className="py-3.5 px-4">
                        {user.profileData?.work_mode ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${user.profileData.work_mode === 'work_from_home'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              }`}
                          >
                            {user.profileData.work_mode === 'work_from_home' ? 'WFH' : 'Office'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      {/* Joining Date */}
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px] font-mono">
                        {user.profileData?.joining_date ? String(user.profileData.joining_date) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {user.supervisorName ? (
                          <span className="text-foreground text-xs font-medium">
                            {user.supervisorName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-3">
                          {hasPermission('USER_UPDATE') && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-semibold text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-450 dark:hover:text-cyan-350 transition-colors cursor-pointer"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                          {hasPermission('USER_UPDATE') && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              onClick={() => handleResetPassword(user.id, user.firstName)}
                            >
                              <Key className="w-3 h-3" />
                              Reset
                            </button>
                          )}
                          {hasPermission('USER_DELETE') && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-semibold text-xs text-rose-600 hover:text-rose-700 dark:text-rose-450 dark:hover:text-rose-350 transition-colors cursor-pointer"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
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
        }
        form={
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Section: Personal Configuration */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-405 flex items-center gap-2">
                <Users className="w-4 h-4" /> Personal Profile
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rahul"
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Sharma"
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@company.com"
                    className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!editingId}
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Credential Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="9100000000"
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Gender
                    </label>
                    <select
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Section: Role and Reporting Supervisor */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-405 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Role Clearance
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Access Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {supervisors.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Reporting Supervisor
                    </label>
                    <select
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={supervisorUserId}
                      onChange={(e) => setSupervisorUserId(e.target.value)}
                    >
                      <option value="">No supervisor</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-border" />

            {/* Section: Employee Profile Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-405 flex items-center gap-2">
                <Users className="w-4 h-4" /> Employee Profile Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Employee ID / Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="EMP001"
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={empCode}
                      onChange={(e) => {
                        setEmpCode(e.target.value);
                        setEmployeeId(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Joining Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Employee Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={employeeType}
                      onChange={(e) => setEmployeeType(e.target.value)}
                    >
                      <option value="regular">Regular</option>
                      <option value="contract">Contract</option>
                      <option value="parttime">Part-Time</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    >
                      <option value="software_engineer">Software Engineer</option>
                      <option value="senior_software_engineer">Senior Software Engineer</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="hr_executive">HR Executive</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="accountant">Accountant</option>
                      <option value="analyst">Analyst</option>
                      <option value="intern">Intern</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Work Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                    >
                      <option value="office">Office</option>
                      <option value="work_from_home">Work From Home</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Address
                  </label>
                  <textarea
                    placeholder="Enter address details..."
                    rows={3}
                    className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic fields */}
            {dynamicFields.length > 0 && (
              <>
                <hr className="border-border" />
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-405 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Extra Information Schema
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {dynamicFields.map((field) => {
                      const value = String(profileData[field.fieldName] ?? '');
                      return (
                        <div key={field.id || field.fieldName}>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </label>
                          {field.type === 'DROPDOWN' ? (
                            <select
                              required={field.required}
                              className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              value={value}
                              onChange={(e) => handleDynamicChange(field.fieldName, e.target.value)}
                            >
                              <option value="">Select option...</option>
                              {(field.options || []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === 'NUMBER' ? 'number' : 'text'}
                              required={field.required}
                              placeholder={field.label}
                              className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              value={value}
                              onChange={(e) => handleDynamicChange(field.fieldName, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Form actions */}
            <div className="border-t border-border pt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-lg shadow-cyan-600/10 cursor-pointer"
              >
                {editingId ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        }
      />
    </div>
  );
}

