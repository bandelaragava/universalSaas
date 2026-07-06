/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Trash2, Edit, AlertCircle } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';
import EntityFormPage from '@/components/shared/EntityFormPage';

interface Role {
  id: number;
  name: string;
}

interface IdFormat {
  id: number;
  entityType: string;
  prefix: string;
  nextSequence: number;
  paddingLength: number;
  includeYear: boolean;
}

export default function IdGenerationSettings() {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [formats, setFormats] = useState<IdFormat[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    entityType: 'EMPLOYEE',
    prefix: 'EMP',
    nextSequence: 1001,
    paddingLength: 7,
    includeYear: false,
  });

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [formatRes, roleRes] = await Promise.all([
        rolesApi.get<IdFormat[]>('/id-formats', { signal, ignore403: true }),
        rolesApi.get<Role[]>('/roles', { signal, ignore403: true }),
      ]);
      setFormats(formatRes.data || []);
      setRoles(roleRes.data || []);
    } catch (err: unknown) {
      const axiosError = err as { name?: string; response?: { data?: { message?: string } } };
      if (axiosError.name === 'CanceledError') return;
      setError('Failed to load ID formats data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await rolesApi.post('/id-formats', form, { ignore403: true });
      showToast('success', 'ID Format saved successfully.');
      setTimeout(() => {
        setViewMode('LIST');
        setEditingId(null);
        fetchData();
      }, 1000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to save ID Format.');
      showToast('error', 'Save operation failed.');
    }
  };

  const handleEdit = (f: IdFormat) => {
    setEditingId(f.id);
    setForm({
      entityType: f.entityType,
      prefix: f.prefix,
      nextSequence: f.nextSequence,
      paddingLength: f.paddingLength || 7,
      includeYear: f.includeYear || false,
    });
    setViewMode('FORM');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this ID pattern format?')) return;
    try {
      await rolesApi.delete(`/id-formats/${id}`, { ignore403: true });
      showToast('success', 'ID format configuration deleted.');
      fetchData();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Failed to delete ID format.');
    }
  };

  const generatePreview = (prefix: string, nextSequence: number, paddingLength: number, includeYear: boolean) => {
    const seqStr = String(nextSequence).padStart(paddingLength, '0');
    const currentYear = new Date().getFullYear();
    return includeYear ? `${prefix}${currentYear}${seqStr}` : `${prefix}${seqStr}`;
  };

  const filteredFormats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return formats;
    return formats.filter(
      (f) => f.entityType.toLowerCase().includes(q) || f.prefix.toLowerCase().includes(q)
    );
  }, [formats, search]);

  if (viewMode === 'FORM') {
    return (
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs p-3.5 rounded-xl flex gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <EntityFormPage
          title={editingId ? 'Edit ID Format' : 'Create ID Format'}
          onSubmit={handleSave}
          onBack={() => {
            setViewMode('LIST');
            setEditingId(null);
            setError(null);
          }}
          submitLabel={editingId ? 'Save Changes' : 'Save Format'}
        >
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Role Name *</label>
                <select
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.entityType}
                  onChange={(e) => setForm({ ...form, entityType: e.target.value.toUpperCase() })}
                  disabled={editingId !== null}
                  required
                >
                  <option value="">-- Select Role --</option>
                  {roles
                    .filter((r) => editingId !== null || !formats.some((f) => f.entityType === r.name.toUpperCase()))
                    .map((r) => (
                      <option key={r.id} value={r.name.toUpperCase()}>
                        {r.name.toUpperCase()}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Prefix *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.prefix}
                  onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Next Sequence *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.nextSequence}
                  onChange={(e) => setForm({ ...form, nextSequence: parseInt(e.target.value, 10) || 1 })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Padding Length</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="15"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.paddingLength}
                  onChange={(e) => setForm({ ...form, paddingLength: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 py-2">
              <input
                type="checkbox"
                id="includeYearCheck"
                className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0"
                checked={form.includeYear}
                onChange={(e) => setForm({ ...form, includeYear: e.target.checked })}
              />
              <label htmlFor="includeYearCheck" className="text-muted-foreground cursor-pointer select-none font-medium">
                Include Current Year in ID
              </label>
            </div>

            <div className="p-4 bg-muted/40 border border-border rounded-lg space-y-1">
              <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Live Preview</span>
              <div className="text-base font-bold text-primary tracking-wider font-mono">
                {generatePreview(form.prefix, form.nextSequence, form.paddingLength, form.includeYear)}
              </div>
            </div>
          </div>
        </EntityFormPage>
      </div>
    );
  }

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
        title="ID Generation Formats"
        description="Configure auto-numbering formulas, prefixes, padding, and variables for various roles."
        addLabel="Add ID Format"
        onAdd={() => {
          setEditingId(null);
          setError(null);
          setForm({
            entityType: roles.length > 0 ? roles[0].name.toUpperCase() : 'EMPLOYEE',
            prefix: 'EMP',
            nextSequence: 1001,
            paddingLength: 7,
            includeYear: false,
          });
          setViewMode('FORM');
        }}
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filteredFormats.length : undefined}
        headerActions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-semibold text-foreground active:scale-95 transition-all"
            onClick={() => fetchData()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Role Name</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Prefix</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Next Sequence</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Padding</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Preview ID</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFormats.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-border text-foreground hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-foreground">{f.entityType}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">{f.prefix}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-foreground">{f.nextSequence}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{f.paddingLength}</td>
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary">
                    {generatePreview(f.prefix, f.nextSequence, f.paddingLength || 7, f.includeYear)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:underline transition-colors"
                        onClick={() => handleEdit(f)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-destructive hover:underline transition-colors"
                        onClick={() => handleDelete(f.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredFormats.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    No custom ID formats configured. Click "Add ID Format" to customize pattern formatting rules.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </EntityListPage>
    </div>
  );
}


