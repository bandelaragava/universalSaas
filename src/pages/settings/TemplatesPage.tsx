/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, Download, ToggleLeft, ToggleRight, Trash2, Edit3, X, Copy } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';

interface Template {
  id: number;
  templateCode: string;
  templateName: string;
  templateType: 'DOCUMENT' | 'CERTIFICATE' | 'INVOICE';
  isSystemTemplate: boolean;
  active: boolean;
  contentHtml: string;
}

const PLACEHOLDERS = [
  '{{COMPANY_NAME}}', '{{COMPANY_LOGO}}', '{{COMPANY_ADDRESS}}',
  '{{COMPANY_SIGNATURE}}', '{{COMPANY_STAMP}}',
  '{{DOCUMENT_NO}}', '{{ISSUE_DATE}}', '{{START_DATE}}', '{{END_DATE}}',
  '{{EMPLOYEE_NAME}}', '{{EMPLOYEE_ID}}', '{{EMPLOYEE_ADDRESS}}',
  '{{DESIGNATION}}', '{{DEPARTMENT}}', '{{WORK_LOCATION}}',
  '{{JOINING_DATE}}', '{{EMPLOYMENT_TYPE}}', '{{PROBATION_PERIOD}}',
  '{{ANNUAL_CTC}}', '{{REPORTING_MANAGER}}', '{{RELIEVING_DATE}}',
  '{{WARNING_REASON}}', '{{OLD_DESIGNATION}}', '{{NEW_DESIGNATION}}', '{{EFFECTIVE_DATE}}',
  '{{OLD_LOCATION}}', '{{NEW_LOCATION}}', '{{TRANSFER_DATE}}',
  '{{COURSE_NAME}}', '{{COMPLETION_DATE}}', '{{TRAINING_NAME}}',
  '{{ACHIEVEMENT_NAME}}', '{{EVENT_NAME}}', '{{EVENT_DATE}}',
  '{{SIGNATORY_NAME}}', '{{SIGNATORY_DESIGNATION}}',
  '{{QR_CODE}}', '{{VERIFICATION_URL}}',
  '{{INVOICE_NUMBER}}', '{{CUSTOMER_NAME}}', '{{CUSTOMER_ADDRESS}}',
  '{{INVOICE_ITEMS}}', '{{SUBTOTAL}}', '{{TAX_AMOUNT}}', '{{TOTAL_AMOUNT}}'
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [systemTemplates, setSystemTemplates] = useState<Template[]>([]);
  const [selectedToImport, setSelectedToImport] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchTemplates = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const url = filterType ? `/templates?type=${filterType}` : '/templates';
      const res = await rolesApi.get<Template[]>(url, { signal, ignore403: true });
      setTemplates(res.data || []);
    } catch (err: unknown) {
      const axiosError = err as { name?: string; response?: { data?: { message?: string } } };
      if (axiosError.name === 'CanceledError') return;
      setError('Failed to fetch templates.');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchTemplates(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchTemplates]);

  const handleOpenImport = async () => {
    try {
      const res = await rolesApi.get<Template[]>('/templates/system', { ignore403: true });
      setSystemTemplates(res.data || []);
      setSelectedToImport(new Set((res.data || []).map((t) => t.templateCode)));
      setShowImportModal(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      alert('Failed to fetch predefined system templates: ' + (axiosError.response?.data?.message || axiosError.message));
    }
  };

  const handleImport = async () => {
    if (selectedToImport.size === 0) return;
    setImporting(true);
    try {
      const payload = Array.from(selectedToImport);
      await rolesApi.post('/templates/import', payload, { ignore403: true });
      showToast('success', 'Predefined templates successfully imported.');
      setShowImportModal(false);
      fetchTemplates();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      alert('Failed to import templates: ' + (axiosError.response?.data?.message || axiosError.message));
    } finally {
      setImporting(false);
    }
  };

  const toggleImportSelection = (code: string) => {
    setSelectedToImport((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this template configuration?')) return;
    try {
      await rolesApi.delete(`/templates/${id}`, { ignore403: true });
      showToast('success', 'Template deleted.');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Failed to delete.');
    }
  };

  const handleClone = async (t: Template) => {
    try {
      const cloned = { ...t } as Partial<Template>;
      delete cloned.id;
      cloned.templateCode = `${t.templateCode}_CUSTOM_${Math.floor(Math.random() * 1000)}`;
      cloned.templateName = `${t.templateName} (Copy)`;
      cloned.isSystemTemplate = false;
      cloned.active = true;

      const res = await rolesApi.post<Template>('/templates', cloned, { ignore403: true });
      showToast('success', 'Template cloned successfully.');
      navigate(`/settings/templates/edit/${res.data.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', 'Failed to clone template: ' + (axiosError.response?.data?.message || axiosError.message));
    }
  };

  const handleToggleActive = async (t: Template) => {
    try {
      await rolesApi.put(`/templates/${t.id}`, { active: !t.active }, { ignore403: true });
      showToast('success', `Template ${!t.active ? 'activated' : 'deactivated'}.`);
      setTemplates((prev) => prev.map((item) => (item.id === t.id ? { ...item, active: !t.active } : item)));
    } catch {
      showToast('error', 'Failed to change template status.');
    }
  };

  const handleDownloadSample = async (t: Template) => {
    try {
      const res = await rolesApi.get(`/templates/${t.id}/sample-pdf`, { responseType: 'blob', ignore403: true });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sample_${t.templateCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('success', 'Sample PDF downloaded.');
    } catch {
      showToast('error', 'Failed to download sample PDF.');
    }
  };

  const handlePreview = (t: Template) => {
    setPreviewTemplate(t);
    setShowPreviewModal(true);
  };

  const handleGenerate = async (t: Template) => {
    if (t.templateType === 'CERTIFICATE') {
      navigate('/settings/certificates');
    } else {
      const empId = window.prompt('Enter Employee ID to generate this document for:');
      if (!empId) return;
      try {
        const res = await rolesApi.post(`/templates/${t.id}/generate`, { employeeId: empId }, { responseType: 'blob', ignore403: true });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${t.templateCode}_${empId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('success', 'Document generated successfully.');
      } catch {
        showToast('error', 'Failed to generate document. Ensure the Employee ID exists.');
      }
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.templateName.toLowerCase().includes(q) || t.templateCode.toLowerCase().includes(q)
    );
  }, [templates, search]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      <EntityListPage
        title="Document & Certificate Templates"
        description="Manage system and custom templates. Add placeholders to configure welcome packages, offers, Relieving contracts, and Certificates."
        addLabel="Create Template"
        addRoute="/settings/templates/create"
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filtered.length : undefined}
        headerActions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-semibold text-foreground active:scale-95 transition-all"
            onClick={handleOpenImport}
          >
            Import System Templates
          </button>
        }
      >
        <div className="flex gap-2 p-4 border-b border-border bg-muted/20">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              filterType === ''
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-transparent border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setFilterType('')}
          >
            All Templates
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              filterType === 'DOCUMENT'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-transparent border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setFilterType('DOCUMENT')}
          >
            Documents
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              filterType === 'CERTIFICATE'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-transparent border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setFilterType('CERTIFICATE')}
          >
            Certificates
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              filterType === 'INVOICE'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-transparent border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setFilterType('INVOICE')}
          >
            Invoices
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Template Code</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Template Name</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Source</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[320px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border text-foreground hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{t.templateCode}</td>
                  <td className="py-3.5 px-4 font-bold text-foreground">{t.templateName}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        t.templateType === 'CERTIFICATE'
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : t.templateType === 'INVOICE'
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {t.templateType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {t.isSystemTemplate ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                        System
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        t.active
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {t.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handlePreview(t)}
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline transition-colors"
                        onClick={() => navigate(`/settings/templates/edit/${t.id}`)}
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleClone(t)}
                        title="Clone Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Clone
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 text-xs text-success hover:underline transition-colors"
                        onClick={() => handleGenerate(t)}
                        title="Generate Document"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Generate
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleDownloadSample(t)}
                        title="Download sample PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Sample
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleToggleActive(t)}
                        title={t.active ? 'Deactivate' : 'Activate'}
                      >
                        {t.active ? (
                          <ToggleRight className="w-4 h-4 text-success" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>

                      {!t.isSystemTemplate && (
                        <button
                          type="button"
                          className="inline-flex items-center text-xs text-destructive hover:underline transition-colors"
                          onClick={() => handleDelete(t.id)}
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    No templates matching the parameters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </EntityListPage>

      {/* Predefined templates import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-lg flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/40">
              <h3 className="text-sm font-bold text-foreground">Import Predefined Templates</h3>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all"
                onClick={() => setShowImportModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 max-h-[350px] overflow-y-auto space-y-2 text-xs">
              <p className="text-muted-foreground mb-3">Select the standard system templates you want to import:</p>
              {systemTemplates.map((sys) => {
                const isExisting = templates.some((t) => t.templateCode === sys.templateCode);
                return (
                  <label
                    key={sys.templateCode}
                    className={`flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-all select-none cursor-pointer ${
                      isExisting ? 'opacity-50 pointer-events-none bg-muted/20' : 'bg-muted/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0"
                      checked={selectedToImport.has(sys.templateCode)}
                      disabled={isExisting}
                      onChange={() => toggleImportSelection(sys.templateCode)}
                    />
                    <div>
                      <div className="font-semibold text-foreground">{sys.templateName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {sys.templateCode} {isExisting && '(Already Imported)'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-4 py-2 bg-background border border-input hover:bg-accent text-foreground font-semibold rounded-md"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-md flex items-center gap-1.5"
                onClick={handleImport}
                disabled={importing || selectedToImport.size === 0}
              >
                {importing ? 'Importing...' : 'Import Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl w-full max-w-5xl overflow-hidden shadow-lg flex flex-col h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/40">
              <div>
                <h3 className="text-sm font-bold text-foreground">Preview: {previewTemplate.templateName}</h3>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  Code: {previewTemplate.templateCode} | Type: {previewTemplate.templateType}
                </div>
              </div>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all"
                onClick={() => setShowPreviewModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              {/* Placeholders sidepanel */}
              <div className="w-[260px] border-r border-border bg-muted/30 p-4 overflow-y-auto hidden md:block">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-3">
                  Variables & Placeholders
                </span>
                <div className="space-y-1.5">
                  {PLACEHOLDERS.map((p) => (
                    <code
                      key={p}
                      className="block text-[10px] font-mono bg-background border border-border px-2 py-1 rounded text-muted-foreground break-all"
                    >
                      {p}
                    </code>
                  ))}
                </div>
              </div>
              {/* Rendered HTML area */}
              <div className="flex-grow p-6 bg-muted/50 overflow-y-auto flex items-start justify-center">
                <div className="w-full max-w-3xl bg-card text-foreground p-8 rounded-lg shadow-sm border border-border min-h-[500px]">
                  <div
                    className="prose prose-sm max-w-none text-foreground leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: previewTemplate.contentHtml }}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-4 py-2 bg-background border border-input hover:bg-accent text-foreground font-semibold rounded-md"
                onClick={() => setShowPreviewModal(false)}
              >
                Close Preview
              </button>
              {previewTemplate.isSystemTemplate ? (
                <button
                  type="button"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md"
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleClone(previewTemplate);
                  }}
                >
                  Clone Template
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 bg-success hover:bg-success/90 text-primary-foreground font-semibold rounded-md"
                    onClick={() => {
                      setShowPreviewModal(false);
                      handleGenerate(previewTemplate);
                    }}
                  >
                    Generate Document
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md"
                    onClick={() => {
                      setShowPreviewModal(false);
                      navigate(`/settings/templates/edit/${previewTemplate.id}`);
                    }}
                  >
                    Edit Template
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
