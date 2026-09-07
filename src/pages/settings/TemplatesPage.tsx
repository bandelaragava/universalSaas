/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  FileText,
  Download,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit3,
  Edit2,
  X,
  Copy,
  Search,
  User,
  Check,
  CheckCircle,
  Loader2,
  Receipt,
  Plus
} from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import { employeeService, EmployeeOption } from '@/services/employees';
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

interface InvoiceConfig {
  id: number;
  invoiceName: string;
  invoicePrefix: string;
  invoiceNumberFormat: string;
  active: boolean;
  targetModule: string;
}

const PREDEFINED_INVOICE_TEMPLATES = [
  { id: 'modern-corporate', name: 'Modern Corporate', prefix: 'MC-', format: 'YYYY-000', color: '#1e293b', terms: '1. Payment due within 15 days.\n2. Late fee of 1.5% per month.' },
  { id: 'classic-business', name: 'Classic Business', prefix: 'CB-', format: 'YYYY-000', color: '#0f172a', terms: 'Payment due on receipt.' },
  { id: 'professional-blue', name: 'Professional Blue', prefix: 'PB-', format: 'YYYY-MM-000', color: '#1d4ed8', terms: '1. Please make all cheques payable to the Company.\n2. Thank you for your business.' },
  { id: 'gst-standard', name: 'GST Standard', prefix: 'GST-', format: 'YYYY-000', color: '#047857', terms: '1. Subject to local jurisdiction.\n2. GST payable on reverse charge: No.' },
  { id: 'minimal-clean', name: 'Minimal Clean', prefix: 'INV-', format: '00000', color: '#171717', terms: 'Thank you.' },
  { id: 'premium-enterprise', name: 'Premium Enterprise', prefix: 'ENT-', format: 'YYYY-MM-DD-000', color: '#4338ca', terms: 'Standard enterprise terms apply.' },
  { id: 'retail-invoice', name: 'Retail Invoice', prefix: 'RET-', format: '000000', color: '#0ea5e9', terms: 'No returns or exchanges without original receipt.' },
  { id: 'service-invoice', name: 'Service Invoice', prefix: 'SRV-', format: 'YYYY-000', color: '#db2777', terms: 'Services rendered are final.' },
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'templates' | 'invoices'>(
    searchParams.get('tab') === 'invoices' ? 'invoices' : 'templates'
  );

  // Document & Certificate Templates State
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

  // Employee Selection Modal for Document Generation
  const [generateTemplate, setGenerateTemplate] = useState<Template | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const [generatingDoc, setGeneratingDoc] = useState(false);

  // Invoice Configurations State
  const [invoiceConfigs, setInvoiceConfigs] = useState<InvoiceConfig[]>([]);
  const [loadingInvoiceConfigs, setLoadingInvoiceConfigs] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoicePreviewTemplate, setInvoicePreviewTemplate] = useState<typeof PREDEFINED_INVOICE_TEMPLATES[0] | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchInvoiceConfigs = useCallback(async () => {
    setLoadingInvoiceConfigs(true);
    try {
      const response = await rolesApi.get('/invoice-configurations', { ignore403: true });
      setInvoiceConfigs(response.data || []);
    } catch (err) {
      console.error('Error fetching configurations:', err);
      showToast('error', 'Failed to load invoice configurations.');
    } finally {
      setLoadingInvoiceConfigs(false);
    }
  }, [showToast]);

  const handleActivateInvoiceConfig = async (id: number) => {
    try {
      await rolesApi.put(`/invoice-configurations/${id}/activate`, {}, { ignore403: true });
      showToast('success', 'Invoice configuration activated successfully.');
      fetchInvoiceConfigs();
    } catch (err) {
      console.error('Error activating configuration:', err);
      showToast('error', 'Failed to activate invoice configuration.');
    }
  };

  const handleDeleteInvoiceConfig = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this invoice configuration?')) return;
    try {
      await rolesApi.delete(`/api/invoice-configurations/${id}`, { ignore403: true });
      showToast('success', 'Invoice configuration deleted.');
      setInvoiceConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting configuration:', err);
      showToast('error', 'Failed to delete invoice configuration.');
    }
  };

  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoiceConfigs();
    }
  }, [activeTab, fetchInvoiceConfigs]);

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const res = await employeeService.list();
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load employee list:', err);
      toast && showToast('error', 'Failed to load employee records.');
    } finally {
      setLoadingEmployees(false);
    }
  }, [showToast]);

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

  const handleOpenGenerateModal = (t: Template) => {
    if (t.templateType === 'CERTIFICATE') {
      navigate('/settings/certificates');
      return;
    }
    setGenerateTemplate(t);
    setSelectedEmployee(null);
    setEmployeeSearch('');
    setShowGenerateModal(true);
    fetchEmployees();
  };

  const handleConfirmGenerate = async () => {
    if (!generateTemplate || !selectedEmployee) return;
    setGeneratingDoc(true);
    try {
      const empId = String(selectedEmployee.user_id || selectedEmployee.id);
      const res = await rolesApi.post(
        `/templates/${generateTemplate.id}/generate`,
        { employeeId: empId, userId: empId },
        { responseType: 'blob', ignore403: true }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const fileCode = selectedEmployee.emp_code || `EMP-${empId}`;
      link.setAttribute('download', `${generateTemplate.templateCode}_${fileCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('success', `Document generated successfully for ${selectedEmployee.display_name || selectedEmployee.username}.`);
      setShowGenerateModal(false);
    } catch {
      showToast('error', 'Failed to generate document. Please ensure the employee profile is active.');
    } finally {
      setGeneratingDoc(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const name = (emp.display_name || `${emp.first_name || ''} ${emp.last_name || ''}` || emp.username || '').toLowerCase();
      const code = (emp.emp_code || '').toLowerCase();
      const id = String(emp.user_id || emp.id || '');
      const email = (emp.email || '').toLowerCase();
      const dept = (emp.department_name || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        id.includes(q) ||
        `emp${id}`.includes(q) ||
        `emp-${id}`.includes(q) ||
        email.includes(q) ||
        dept.includes(q) ||
        desig.includes(q)
      );
    });
  }, [employees, employeeSearch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.templateName.toLowerCase().includes(q) || t.templateCode.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const filteredInvoiceConfigs = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    if (!q) return invoiceConfigs;
    return invoiceConfigs.filter((c) =>
      c.invoiceName.toLowerCase().includes(q) ||
      (c.invoicePrefix && c.invoicePrefix.toLowerCase().includes(q)) ||
      (c.targetModule && c.targetModule.toLowerCase().includes(q))
    );
  }, [invoiceConfigs, invoiceSearch]);

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

      {/* Top Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border bg-card/60 p-1.5 rounded-xl border">
        <button
          type="button"
          onClick={() => {
            setActiveTab('templates');
            setSearchParams({});
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          Document &amp; Certificate Templates
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('invoices');
            setSearchParams({ tab: 'invoices' });
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Invoice Configurations
        </button>
      </div>

      {activeTab === 'templates' ? (
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
                          className="inline-flex items-center gap-0.5 text-xs text-success hover:underline transition-colors cursor-pointer"
                          onClick={() => handleOpenGenerateModal(t)}
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
      ) : (
        /* Invoice Configurations Tab Content */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-xl shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-foreground">Invoice Configurations</h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                Manage custom invoice templates, prefixes, numbering formats, and module bindings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/settings/invoice-configurations/create')}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-xs font-semibold text-xs active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Configuration
            </button>
          </div>

          {/* Predefined Invoice Layouts */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Predefined Billing Invoice Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {PREDEFINED_INVOICE_TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className="bg-muted/30 border border-border rounded-xl p-4 hover:border-primary/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }}></div>
                      <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">{t.name}</h4>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mb-3">
                      Prefix: <span className="text-foreground font-semibold">{t.prefix}</span> | Format: <span className="text-foreground">{t.format}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setInvoicePreviewTemplate(t)}
                      className="flex-1 flex justify-center items-center gap-1 py-1.5 px-2.5 bg-background hover:bg-muted text-foreground text-[11px] font-semibold rounded-lg border border-border transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-muted-foreground" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/settings/invoice-configurations/create', { state: { template: t } })}
                      className="flex-1 flex justify-center items-center gap-1 py-1.5 px-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold rounded-lg border border-primary/20 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3 h-3" /> Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Saved Invoice Configurations */}
          <div className="bg-card rounded-xl shadow-xs border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-foreground">Saved Invoice Configurations</h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search configurations..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {loadingInvoiceConfigs ? (
              <div className="p-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading configurations...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Configuration Name</th>
                      <th className="px-5 py-3.5">Target Module</th>
                      <th className="px-5 py-3.5">Prefix</th>
                      <th className="px-5 py-3.5">Format</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {filteredInvoiceConfigs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-xs">
                          No invoice configurations found. Click &quot;Add Configuration&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoiceConfigs.map((config) => (
                        <tr key={config.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-foreground">{config.invoiceName}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              config.targetModule === 'ALL' ? 'bg-primary/10 text-primary border-primary/20' :
                              config.targetModule === 'VENDOR' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              config.targetModule === 'BILLING' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                              'bg-muted text-muted-foreground border-border'
                            }`}>
                              {config.targetModule || 'ALL'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground font-mono">{config.invoicePrefix || '-'}</td>
                          <td className="px-5 py-3.5 text-muted-foreground font-mono">{config.invoiceNumberFormat || '-'}</td>
                          <td className="px-5 py-3.5 text-center">
                            {config.active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success/10 text-success border border-success/20">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleActivateInvoiceConfig(config.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer border border-border"
                              >
                                Set Active
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/settings/invoice-configurations/edit/${config.id}`)}
                                className="p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoiceConfig(config.id)}
                                className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Live Preview Modal for Documents */}
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
                    className="px-4 py-2 bg-success hover:bg-success/90 text-primary-foreground font-semibold rounded-md cursor-pointer"
                    onClick={() => {
                      setShowPreviewModal(false);
                      handleOpenGenerateModal(previewTemplate);
                    }}
                  >
                    Generate Document
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md cursor-pointer"
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

      {/* Invoice Template Live Preview Modal */}
      {invoicePreviewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/40">
              <h3 className="font-bold text-sm text-foreground">{invoicePreviewTemplate.name} Preview</h3>
              <button
                type="button"
                onClick={() => setInvoicePreviewTemplate(null)}
                className="p-1 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-muted/30 flex justify-center">
              <div className="bg-card text-foreground w-full max-w-3xl min-h-[700px] shadow-sm border border-border p-8 rounded-xl font-sans">
                <div className="flex justify-between items-start border-b-[3px] pb-6 mb-8" style={{ borderColor: invoicePreviewTemplate.color }}>
                  <div>
                    <div className="w-32 h-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs font-bold mb-3 border border-border">
                      [Company Logo]
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="font-bold text-foreground">Your Company Name</p>
                      <p>123 Business Avenue</p>
                      <p>City, State, 12345</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-black uppercase tracking-wider mb-1" style={{ color: invoicePreviewTemplate.color }}>
                      Invoice
                    </h1>
                    <p className="text-xs font-semibold text-foreground">Invoice No: {invoicePreviewTemplate.prefix}0001</p>
                    <p className="text-xs text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Due Date: {new Date(Date.now() + 15 * 86400000).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Bill To</h3>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="font-bold text-foreground">Acme Corporation</p>
                    <p>456 Client Street, Suite 900</p>
                    <p>Business City, 98765</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs mb-6 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: invoicePreviewTemplate.color }}>
                      <th className="py-2 px-3 font-bold">Item / Description</th>
                      <th className="py-2 px-3 text-right font-bold">Qty</th>
                      <th className="py-2 px-3 text-right font-bold">Price</th>
                      <th className="py-2 px-3 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    <tr>
                      <td className="py-3 px-3">
                        <p className="font-bold text-foreground">SaaS Subscription - Pro Plan</p>
                        <p className="text-[10px] text-muted-foreground">Monthly billing cycle</p>
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">1</td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-mono">₹499.00</td>
                      <td className="py-3 px-3 text-right font-semibold text-foreground font-mono">₹499.00</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3">
                        <p className="font-bold text-foreground">Setup &amp; Onboarding</p>
                        <p className="text-[10px] text-muted-foreground">One-time fee</p>
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">1</td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-mono">₹150.00</td>
                      <td className="py-3 px-3 text-right font-semibold text-foreground font-mono">₹150.00</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-start">
                  <div className="w-1/2 pr-6">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Terms &amp; Conditions</h3>
                    <p className="text-[11px] text-muted-foreground whitespace-pre-line leading-relaxed">{invoicePreviewTemplate.terms}</p>
                  </div>
                  <div className="w-1/2">
                    <table className="w-full text-xs">
                      <tbody>
                        <tr>
                          <td className="py-1.5 text-muted-foreground font-medium">Subtotal</td>
                          <td className="py-1.5 text-right font-mono text-foreground">₹649.00</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-muted-foreground font-medium border-b border-border">Tax (10%)</td>
                          <td className="py-1.5 text-right border-b border-border font-mono text-foreground">₹64.90</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-sm font-bold text-foreground">Total Due</td>
                          <td className="py-2.5 text-sm font-bold text-right font-mono" style={{ color: invoicePreviewTemplate.color }}>
                            ₹713.90
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-border flex justify-between items-end">
                  <div className="text-center">
                    <div className="w-40 border-b border-border mb-1.5 h-8"></div>
                    <p className="text-[10px] text-muted-foreground">Authorized Signature</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Thank you for your business.</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-2 text-xs">
              <button 
                type="button"
                onClick={() => setInvoicePreviewTemplate(null)}
                className="px-4 py-2 bg-background border border-input hover:bg-accent text-foreground font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = invoicePreviewTemplate;
                  setInvoicePreviewTemplate(null);
                  navigate('/settings/invoice-configurations/create', { state: { template: t } });
                }}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Document Employee Selection Modal */}
      {showGenerateModal && generateTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Generate Document</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">{generateTemplate.templateName}</span>
                    <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                      {generateTemplate.templateCode}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all cursor-pointer"
                onClick={() => setShowGenerateModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Search Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Search Employee
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search by Employee Name or Employee ID..."
                    className="w-full pl-10 pr-9 py-2.5 bg-background border border-input text-foreground text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  {employeeSearch && (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Employee Summary Banner */}
              {selectedEmployee && (
                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                      {(selectedEmployee.display_name || selectedEmployee.first_name || 'E').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-xs truncate">
                          {selectedEmployee.display_name || `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim() || selectedEmployee.username}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {selectedEmployee.emp_code || `EMP-${selectedEmployee.user_id || selectedEmployee.id}`}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {selectedEmployee.designation || 'Staff'} {selectedEmployee.department_name ? `• ${selectedEmployee.department_name}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary shrink-0">
                    <Check className="w-4 h-4" />
                    <span>Selected</span>
                  </div>
                </div>
              )}

              {/* Employee Results List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {employeeSearch ? 'Search Results' : 'All Employees'} ({filteredEmployees.length})
                  </span>
                  {loadingEmployees && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                    </span>
                  )}
                </div>

                <div className="max-h-[250px] overflow-y-auto space-y-1.5 border border-border rounded-xl p-2 bg-muted/20 custom-scrollbar">
                  {loadingEmployees ? (
                    <div className="py-8 text-center text-muted-foreground text-xs">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading employee records...
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground space-y-1">
                      <User className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-semibold text-foreground text-xs">No employees found</p>
                      <p className="text-[11px] text-muted-foreground">
                        {employeeSearch
                          ? `No matches for "${employeeSearch}". Try searching by name or ID.`
                          : 'No employee records available.'}
                      </p>
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = selectedEmployee?.user_id === emp.user_id || (selectedEmployee?.id === emp.id && emp.id !== undefined);
                      const code = emp.emp_code || `EMP-${emp.user_id || emp.id}`;
                      const name = emp.display_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username;

                      return (
                        <div
                          key={emp.user_id || emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-foreground shadow-xs font-semibold'
                              : 'bg-card border-border/80 hover:bg-muted hover:border-border text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">{name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {emp.designation || 'Staff'} {emp.department_name ? `• ${emp.department_name}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border font-bold">
                              {code}
                            </span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-between text-xs">
              <div className="text-[11px] text-muted-foreground">
                {selectedEmployee ? (
                  <span>Ready for <strong className="text-foreground">{selectedEmployee.display_name || selectedEmployee.username}</strong></span>
                ) : (
                  <span className="text-muted-foreground/70">Select an employee from the list to continue</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-background border border-input hover:bg-accent text-foreground font-semibold rounded-lg transition-colors cursor-pointer"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedEmployee || generatingDoc}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  onClick={handleConfirmGenerate}
                >
                  {generatingDoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Generate Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


