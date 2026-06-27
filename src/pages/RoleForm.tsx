import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';

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
}

export default function RoleForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Extra fields state
  const [fields, setFields] = useState<RoleField[]>([]);
  const [fieldForm, setFieldForm] = useState({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'TEXT',
    required: false,
    options: '',
    displayOrder: 0,
  });
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [fieldMsg, setFieldMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const ctrl = new AbortController();

    const loadRoleData = async () => {
      try {
        const rolesRes = await rolesApi.get<Role[]>('/roles', { signal: ctrl.signal });
        const role = rolesRes.data.find((r) => String(r.id) === String(id));
        if (role) {
          setName(role.name);
          setDescription(role.description || '');
        }

        const fieldsRes = await rolesApi.get<RoleField[]>(`/roles/${id}/extra-fields`, {
          signal: ctrl.signal,
        });
        setFields(fieldsRes.data || []);
      } catch (err: unknown) {
        const axiosError = err as { name?: string; response?: { data?: { message?: string } }; message?: string };
        if (axiosError.name === 'CanceledError') return;
        setError('Failed to load role details.');
      } finally {
        setFetching(false);
      }
    };

    loadRoleData();
    return () => ctrl.abort();
  }, [id, isEdit]);

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = "Role name is required";
    else if (name.length < 2) errors.name = "Role name must be at least 2 characters";

    if (!description.trim()) errors.description = "Description is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isEdit) {
        await rolesApi.put(`/roles/${id}`, { name, description, permissionIds: [] });
        if (fieldForm.fieldName && fieldForm.fieldLabel) {
          const opts = fieldForm.options
            ? fieldForm.options.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          const payload = {
            fieldName: fieldForm.fieldName,
            fieldLabel: fieldForm.fieldLabel,
            fieldType: fieldForm.fieldType,
            required: fieldForm.required,
            options: opts,
            displayOrder: Number(fieldForm.displayOrder),
          };
          if (editingFieldId) {
            await rolesApi.put(`/roles/${id}/extra-fields/${editingFieldId}`, payload);
          } else {
            await rolesApi.post(`/roles/${id}/extra-fields`, payload);
          }
        }
      } else {
        await rolesApi.post('/roles', { name, description, permissionIds: [] });
      }
      setSuccess(isEdit ? 'Role updated successfully.' : 'Role created successfully.');
      setTimeout(() => navigate('/roles'), 900);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: any }; message?: string };
      let errorMsg = 'Failed to save role';

      if (axiosError.response?.data) {
        if (typeof axiosError.response.data === 'object') {
          if (axiosError.response.data.errors) {
            setFormErrors(axiosError.response.data.errors);
            errorMsg = "Please correct the highlighted errors.";
          } else if (axiosError.response.data.message) {
            errorMsg = axiosError.response.data.message;
          }
        } else if (typeof axiosError.response.data === 'string') {
          errorMsg = axiosError.response.data;
        }
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFieldMsg(null);

    if (!fieldForm.fieldName || !fieldForm.fieldLabel) {
      setFieldMsg('Error: Both fieldName (Key) and Display Label are required.');
      return;
    }

    const opts = fieldForm.options
      ? fieldForm.options.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const payload = {
      fieldName: fieldForm.fieldName,
      fieldLabel: fieldForm.fieldLabel,
      fieldType: fieldForm.fieldType,
      required: fieldForm.required,
      options: opts,
      displayOrder: Number(fieldForm.displayOrder),
    };

    try {
      if (editingFieldId) {
        await rolesApi.put(`/roles/${id}/extra-fields/${editingFieldId}`, payload);
      } else {
        await rolesApi.post(`/roles/${id}/extra-fields`, payload);
      }
      const res = await rolesApi.get<RoleField[]>(`/roles/${id}/extra-fields`);
      setFields(res.data);
      setFieldMsg('Saved successfully.');
      setEditingFieldId(null);
      setFieldForm({
        fieldName: '',
        fieldLabel: '',
        fieldType: 'TEXT',
        required: false,
        options: '',
        displayOrder: 0,
      });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setFieldMsg('Error: ' + (axiosError.response?.data?.message || axiosError.message));
    }
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveField();
    }
  };

  const handleDeleteField = async (fid: number) => {
    try {
      await rolesApi.delete(`/roles/${id}/extra-fields/${fid}`);
      setFields((prev) => prev.filter((f) => f.id !== fid));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setFieldMsg('Error: ' + (axiosError.response?.data?.message || axiosError.message));
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <EntityFormPage
      title={isEdit ? 'Edit Role' : 'Create Role'}
      subtitle="Roles"
      backRoute="/roles"
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save Changes' : 'Create Role'}
      loading={loading}
      error={error}
      success={success}
    >
      <div className="space-y-6">
        {/* Section: Role Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Role Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Role Name <span className="text-rose-550">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MANAGER"
                className={`w-full bg-background border ${formErrors.name ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                value={name}
                onChange={(e) => { setName(e.target.value.toUpperCase()); setFormErrors(prev => ({ ...prev, name: '' })) }}
              />
              {formErrors.name && <span className="text-[10px] text-rose-500 block mt-1">{formErrors.name}</span>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description <span className="text-rose-555">*</span>
            </label>
            <textarea
              required
              placeholder="Describe what this role does"
              className={`w-full bg-background border ${formErrors.description ? 'border-rose-500' : 'border-slate-855'} text-slate-200 text-sm rounded-lg px-3.5 py-2 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-cyan-500`}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setFormErrors(prev => ({ ...prev, description: '' })) }}
            />
            {formErrors.description && <span className="text-[10px] text-rose-500 block mt-1">{formErrors.description}</span>}
          </div>
        </div>

        {/* Section: Custom Fields (Only if editing/has ID) */}
        {isEdit && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 border-b border-slate-800 pb-3">
              Custom Profile Fields
            </h3>
            {fieldMsg && (
              <div
                className={`p-3 rounded-lg text-sm border ${fieldMsg.startsWith('Error')
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-455'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}
              >
                {fieldMsg}
              </div>
            )}

            {/* Custom Field Add/Edit Form */}
            <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {editingFieldId ? 'Edit Field' : 'Add New Field'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <input
                    type="text"
                    placeholder="fieldName (camelCase)"
                    className="w-full bg-background border border-slate-800 text-slate-200 text-sm rounded px-3 py-1.5 focus:outline-none"
                    value={fieldForm.fieldName}
                    onChange={(e) => setFieldForm((p) => ({ ...p, fieldName: e.target.value }))}
                    onKeyDown={handleFieldKeyDown}
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    placeholder="Display Label"
                    className="w-full bg-background border border-slate-800 text-slate-200 text-sm rounded px-3 py-1.5 focus:outline-none"
                    value={fieldForm.fieldLabel}
                    onChange={(e) => setFieldForm((p) => ({ ...p, fieldLabel: e.target.value }))}
                    onKeyDown={handleFieldKeyDown}
                  />
                </div>
                <div className="md:col-span-2">
                  <select
                    className="w-full bg-background border border-slate-800 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none"
                    value={fieldForm.fieldType}
                    onChange={(e) => setFieldForm((p) => ({ ...p, fieldType: e.target.value }))}
                  >
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="DROPDOWN">Dropdown</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    placeholder="Options (comma-separated)"
                    className="w-full bg-background border border-slate-800 text-slate-200 text-sm rounded px-3 py-1.5 focus:outline-none disabled:opacity-50"
                    value={fieldForm.options}
                    onChange={(e) => setFieldForm((p) => ({ ...p, options: e.target.value }))}
                    onKeyDown={handleFieldKeyDown}
                    disabled={fieldForm.fieldType !== 'DROPDOWN'}
                  />
                </div>
                <div className="md:col-span-1 flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="freq"
                    className="rounded bg-background border-slate-800 text-cyan-500 focus:ring-0"
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm((p) => ({ ...p, required: e.target.checked }))}
                  />
                  <label htmlFor="freq" className="text-xs text-slate-400 cursor-pointer">
                    Req
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveField()}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded transition-colors"
                >
                  {editingFieldId ? 'Update Field' : 'Add Field'}
                </button>
                {editingFieldId && (
                  <button
                    type="button"
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition-colors border border-slate-700"
                    onClick={() => {
                      setEditingFieldId(null);
                      setFieldForm({
                        fieldName: '',
                        fieldLabel: '',
                        fieldType: 'TEXT',
                        required: false,
                        options: '',
                        displayOrder: 0,
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Custom Fields List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2.5 px-3 font-semibold">Key</th>
                    <th className="py-2.5 px-3 font-semibold">Label</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Required</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-slate-500">
                        No custom fields configured yet.
                      </td>
                    </tr>
                  ) : (
                    fields.map((f) => (
                      <tr key={f.id} className="border-b border-slate-800/55 text-slate-300">
                        <td className="py-2.5 px-3">
                          <code className="bg-slate-955 px-2 py-0.5 rounded text-cyan-405 border border-slate-800">
                            {f.fieldName}
                          </code>
                        </td>
                        <td className="py-2.5 px-3 font-medium">{f.label}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                            {f.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {f.required ? (
                            <span className="text-rose-400 font-semibold">Yes</span>
                          ) : (
                            <span className="text-slate-500">No</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              className="text-cyan-400 hover:text-cyan-300 transition-colors"
                              onClick={() => {
                                setEditingFieldId(f.id);
                                setFieldForm({
                                  fieldName: f.fieldName,
                                  fieldLabel: f.label,
                                  fieldType: f.type,
                                  required: f.required,
                                  options: f.options?.join(', ') || '',
                                  displayOrder: f.displayOrder || 0,
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-rose-455 hover:text-rose-400 transition-colors"
                              onClick={() => handleDeleteField(f.id)}
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
          </div>
        )}
      </div>
    </EntityFormPage>
  );
}

