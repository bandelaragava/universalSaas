/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import Modal from '@/components/ui/Modal';

interface RoleField {
  id: number;
  fieldName: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DROPDOWN' | string;
  required: boolean;
  options?: string[];
  displayOrder?: number;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  permissions?: string[];
}

export default function CreateRole() {
  const [roles, setRoles] = useState<Role[]>([]);

  // Create/Edit Role State
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manage Extra Fields State
  const [selectedRoleForFields, setSelectedRoleForFields] = useState<Role | null>(null);
  const [roleFields, setRoleFields] = useState<RoleField[]>([]);
  const [fieldEditingId, setFieldEditingId] = useState<number | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldDisplayOrder, setFieldDisplayOrder] = useState('0');
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.get<Role[]>('/roles');
      setRoles(response.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch roles');
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const payload = {
      name,
      description,
      permissionIds: [], // required parameter
    };

    try {
      if (editRoleId) {
        await rolesApi.put(`/roles/${editRoleId}`, payload);
        setMessage('Role Updated Successfully!');
      } else {
        await rolesApi.post('/roles', payload);
        setMessage('Role Created Successfully!');
      }
      resetForm();
      fetchRoles();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to save role');
    }
  };

  const handleEditClick = (role: Role) => {
    setEditRoleId(role.id);
    setName(role.name);
    setDescription(role.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditRoleId(null);
    setName('');
    setDescription('');
    setError(null);
    setMessage(null);
  };

  const handleToggleStatus = async (role: Role) => {
    setMessage(null);
    setError(null);
    try {
      if (role.active) {
        await rolesApi.put(`/roles/${role.id}/disable`);
        setMessage(`Role '${role.name}' disabled successfully!`);
      } else {
        await rolesApi.put(`/roles/${role.id}/enable`);
        setMessage(`Role '${role.name}' enabled successfully!`);
      }
      fetchRoles();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Action failed');
    }
  };

  // Extra Fields Handlers
  const fetchRoleFields = async (roleId: number) => {
    try {
      const response = await rolesApi.get<RoleField[]>(`/roles/${roleId}/extra-fields`);
      setRoleFields(response.data);
    } catch (err) {
      console.error('Error fetching role fields:', err);
    }
  };

  const handleOpenFields = (role: Role) => {
    setSelectedRoleForFields(role);
    fetchRoleFields(role.id);
    resetFieldForm();
    setModalMessage(null);
    setModalError(null);
  };

  const handleSaveField = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalMessage(null);
    setModalError(null);

    if (!selectedRoleForFields) return;

    const parsedOptions = fieldOptions
      ? fieldOptions.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      fieldName,
      fieldLabel,
      fieldType,
      required: fieldRequired,
      options: parsedOptions,
      displayOrder: parseInt(fieldDisplayOrder, 10) || 0,
    };

    try {
      if (fieldEditingId) {
        await rolesApi.put(`/roles/${selectedRoleForFields.id}/extra-fields/${fieldEditingId}`, payload);
        setModalMessage('Field updated successfully!');
      } else {
        await rolesApi.post(`/roles/${selectedRoleForFields.id}/extra-fields`, payload);
        setModalMessage('Field created successfully!');
      }
      resetFieldForm();
      fetchRoleFields(selectedRoleForFields.id);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setModalError(axiosError.response?.data?.message || axiosError.message || 'Failed to save field');
    }
  };

  const handleEditField = (field: RoleField) => {
    setFieldEditingId(field.id);
    setFieldName(field.fieldName);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldRequired(field.required);
    setFieldOptions(field.options ? field.options.join(', ') : '');
    setFieldDisplayOrder(field.displayOrder?.toString() || '0');
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!selectedRoleForFields) return;
    setModalMessage(null);
    setModalError(null);
    try {
      await rolesApi.delete(`/roles/${selectedRoleForFields.id}/extra-fields/${fieldId}`);
      setModalMessage('Field deleted successfully!');
      fetchRoleFields(selectedRoleForFields.id);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setModalError(axiosError.response?.data?.message || axiosError.message || 'Failed to delete field');
    }
  };

  const resetFieldForm = () => {
    setFieldEditingId(null);
    setFieldName('');
    setFieldLabel('');
    setFieldType('TEXT');
    setFieldRequired(false);
    setFieldOptions('');
    setFieldDisplayOrder('0');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50 tracking-tight">Role Construction Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Configure role structures, status, and dynamic custom field attributes.</p>
        </div>
      </div>

      {message && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">{message}</div>}
      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-4 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200">{editRoleId ? 'Edit Role' : 'Create Role'}</h3>
            {editRoleId && (
              <button
                type="button"
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded px-2.5 py-1 transition-colors"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleCreateRole} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Role Name <span className="text-rose-550">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MANAGER"
                className="w-full bg-background border border-slate-855 text-slate-200 text-sm rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Description <span className="text-rose-550">*</span>
              </label>
              <textarea
                required
                placeholder="Role description"
                className="w-full bg-slate-955 border border-slate-850 text-slate-200 text-sm rounded-lg px-3.5 py-2 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className={`w-full font-semibold py-2.5 px-4 rounded-xl text-white shadow-lg text-sm transition-all active:scale-95 ${
                editRoleId
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/10'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/10'
              }`}
            >
              {editRoleId ? 'Update Role' : 'Create Role'}
            </button>
          </form>
        </div>

        {/* Right Column: Roles List */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200">Roles List</h3>
            <button
              onClick={fetchRoles}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded px-2.5 py-1 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-955 text-slate-400">
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">ID</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">
                      No roles found.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr
                      key={role.id}
                      className={`border-b border-slate-800/60 text-slate-300 hover:bg-slate-950/20 transition-colors ${
                        !role.active ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-xs">{role.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{role.name}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{role.description || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                            role.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {role.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => handleEditClick(role)}
                            className="bg-slate-850 hover:bg-slate-800 text-cyan-400 border border-slate-750 rounded px-2 py-1 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleOpenFields(role)}
                            className="bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded px-2 py-1 transition-colors"
                          >
                            Fields
                          </button>
                          {role.name !== 'SUPER_ADMIN' ? (
                            <button
                              onClick={() => handleToggleStatus(role)}
                              className={`border rounded px-2 py-1 transition-colors ${
                                role.active
                                  ? 'bg-slate-850 hover:bg-slate-800 text-amber-500 border-slate-750'
                                  : 'bg-slate-850 hover:bg-slate-800 text-emerald-400 border-slate-750'
                              }`}
                            >
                              {role.active ? 'Disable' : 'Enable'}
                            </button>
                          ) : (
                            <span className="inline-flex items-center bg-slate-800/50 text-slate-500 px-2 py-1 rounded text-xs border border-slate-800">
                              System
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
        </div>
      </div>

      {selectedRoleForFields && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRoleForFields(null)}
          title={`Manage Extra Fields: ${selectedRoleForFields.name}`}
        >
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto font-sans text-slate-200 bg-slate-900">
            {modalMessage && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm">{modalMessage}</div>}
            {modalError && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3 rounded-lg text-sm">{modalError}</div>}

            <form onSubmit={handleSaveField} className="bg-background border border-slate-850 p-4 rounded-xl space-y-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-850 pb-2">
                {fieldEditingId ? 'Edit Custom Field' : 'Add New Custom Field'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Key (camelCase)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. employeeId"
                    className="w-full bg-slate-900 border border-slate-800 rounded text-sm px-3 py-1.5 focus:outline-none"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Label (Display)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Employee ID"
                    className="w-full bg-slate-900 border border-slate-800 rounded text-sm px-3 py-1.5 focus:outline-none"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Type</label>
                  <select
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded text-sm px-2.5 py-1.5 focus:outline-none"
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                  >
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="DROPDOWN">Dropdown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-6">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Options (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales, Tech, HR"
                    className="w-full bg-slate-900 border border-slate-800 rounded text-sm px-3 py-1.5 focus:outline-none disabled:opacity-50"
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    disabled={fieldType !== 'DROPDOWN'}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded text-sm px-3 py-1.5 focus:outline-none"
                    value={fieldDisplayOrder}
                    onChange={(e) => setFieldDisplayOrder(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="fieldRequiredCheck"
                    className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                  />
                  <label htmlFor="fieldRequiredCheck" className="text-xs text-slate-400 cursor-pointer">Required</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-850 pt-3">
                {fieldEditingId && (
                  <button
                    type="button"
                    onClick={resetFieldForm}
                    className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded shadow-md transition-colors"
                >
                  {fieldEditingId ? 'Save Field' : 'Add Field'}
                </button>
              </div>
            </form>

            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mt-4">Existing Fields</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/20 text-slate-400">
                    <th className="py-2 px-3 font-semibold">Key</th>
                    <th className="py-2 px-3 font-semibold">Label</th>
                    <th className="py-2 px-3 font-semibold">Type</th>
                    <th className="py-2 px-3 font-semibold">Required</th>
                    <th className="py-2 px-3 font-semibold">Options</th>
                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roleFields.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-slate-500">
                        No fields defined yet.
                      </td>
                    </tr>
                  ) : (
                    roleFields.map((field) => (
                      <tr key={field.id} className="border-b border-slate-800/40 text-slate-300">
                        <td className="py-2 px-3 font-mono text-[10px] text-cyan-400">{field.fieldName}</td>
                        <td className="py-2 px-3 font-medium">{field.label}</td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded text-[9px] border border-slate-800">
                            {field.type}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={field.required ? 'text-rose-455' : 'text-slate-500'}>
                            {field.required ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{field.options?.join(', ') || '-'}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex justify-end gap-2.5">
                            <button
                              type="button"
                              className="text-cyan-400 hover:text-cyan-300"
                              onClick={() => handleEditField(field)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-rose-455 hover:text-rose-400"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/60 mt-4">
              <button
                type="button"
                onClick={() => setSelectedRoleForFields(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}




