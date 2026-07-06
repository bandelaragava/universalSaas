/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Download, Ban, Search, CheckCircle, RefreshCw, X, ShieldAlert, Award } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';
import Select from 'react-select';
import JoditEditor from 'jodit-react';

interface Template {
  id: number;
  templateName: string;
}

interface User {
  id: number;
  employeeId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface Certificate {
  id: number;
  certificateNo: string;
  employeeId: string;
  issuedDate: string;
  status: 'ACTIVE' | 'REVOKED';
  verificationToken: string;
  template?: {
    templateName: string;
  };
}

export default function CertificatesList() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState({
    userId: '',
    templateId: '',
    issuedDate: new Date().toISOString().split('T')[0],
    customHtml: '',
    sendEmail: false
  });
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const editorRef = useRef<any>(null);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyData, setVerifyData] = useState<Certificate | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [certRes, tempRes, empRes] = await Promise.all([
        rolesApi.get<Certificate[]>('/certificates', { signal, ignore403: true }),
        rolesApi.get<Template[]>('/templates', { signal, ignore403: true }),
        rolesApi.get<User[]>('/users', { signal, ignore403: true })
      ]);
      setCertificates(certRes.data || []);
      setTemplates(tempRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err: unknown) {
      const axiosError = err as { name?: string; response?: { data?: { message?: string } } };
      if (axiosError.name === 'CanceledError') return;
      setError('Failed to fetch certificates data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateData.userId || !generateData.templateId) {
      alert('Please select both Employee and Template.');
      return;
    }
    setPreviewing(true);
    try {
      const payload = {
        userId: generateData.userId,
        templateId: generateData.templateId,
        issuedDate: new Date(generateData.issuedDate).toISOString()
      };
      const res = await rolesApi.post<string>('/certificates/preview', payload, { ignore403: true });
      setGenerateData((prev) => ({ ...prev, customHtml: res.data || '' }));
      setIsPreviewMode(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      alert('Failed to load preview: ' + (axiosError.response?.data?.message || axiosError.message));
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const payload = {
        userId: generateData.userId,
        templateId: generateData.templateId,
        issuedDate: new Date(generateData.issuedDate).toISOString(),
        customHtml: generateData.customHtml,
        sendEmail: generateData.sendEmail
      };
      await rolesApi.post('/certificates/generate', payload, { ignore403: true });
      showToast('success', 'Document/Certificate issued successfully.');
      setShowGenerateModal(false);
      setIsPreviewMode(false);
      fetchData();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      alert('Failed to generate document: ' + (axiosError.response?.data?.message || axiosError.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const res = await rolesApi.get(`/certificates/${id}/download`, { responseType: 'blob', ignore403: true });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('success', 'PDF downloaded successfully.');
    } catch {
      showToast('error', 'Failed to download certificate PDF.');
    }
  };

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Are you sure you want to revoke this issued document? This action is irreversible.')) return;
    try {
      await rolesApi.put(`/certificates/${id}/revoke`, undefined, { ignore403: true });
      showToast('success', 'Certificate successfully revoked.');
      fetchData();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Failed to revoke document.');
    }
  };

  const handleVerify = (cert: Certificate) => {
    setVerifyData(cert);
    setShowVerifyModal(true);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return certificates;
    return certificates.filter(
      (c) =>
        c.certificateNo.toLowerCase().includes(q) ||
        c.employeeId.toLowerCase().includes(q) ||
        (c.template?.templateName || '').toLowerCase().includes(q)
    );
  }, [certificates, search]);

  const selectStyles = useMemo(() => ({
    control: (base: any) => ({
      ...base,
      backgroundColor: 'var(--background)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)',
      fontSize: '12px',
      borderRadius: '8px',
      minHeight: '38px',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'var(--foreground)'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      borderWidth: '1px'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? 'var(--accent)' : 'transparent',
      color: 'var(--foreground)',
      fontSize: '12px',
      cursor: 'pointer'
    })
  }), []);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-455'
            }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      <EntityListPage
        title="Employee Documents & Certificates"
        description="Issue official company certificates, relieving/joining contracts, and experience letters. Review active/revoked credentials and scan security QR codes."
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filtered.length : undefined}
        headerActions={
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 justify-center rounded-md border border-transparent bg-primary hover:bg-primary/90 h-9 px-4 text-xs font-semibold text-primary-foreground active:scale-95 transition-all shadow-sm"
              onClick={() => {
                setGenerateData({ userId: '', templateId: '', issuedDate: new Date().toISOString().split('T')[0], customHtml: '', sendEmail: false });
                setIsPreviewMode(false);
                setShowGenerateModal(true);
              }}
            >
              <Award className="w-3.5 h-3.5" />
              Issue New Document
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-xs font-semibold text-foreground active:scale-95 transition-all"
              onClick={() => fetchData()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Document No</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Employee ID</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Template Name</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Date Issued</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[240px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border text-foreground hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{c.certificateNo}</td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-foreground">{c.employeeId}</td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">{c.template?.templateName || 'Unknown'}</td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{new Date(c.issuedDate).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${c.status === 'ACTIVE'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold"
                        onClick={() => handleVerify(c)}
                      >
                        <Search className="w-3.5 h-3.5" />
                        Verify
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline transition-colors font-semibold"
                        onClick={() => handleDownload(c.id)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                      {c.status === 'ACTIVE' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-0.5 text-xs text-destructive hover:underline transition-colors font-semibold"
                          onClick={() => handleRevoke(c.id)}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    No issued documents or certificates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </EntityListPage>

      {/* Generate Document / Cert Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl w-full max-w-4xl overflow-hidden shadow-lg flex flex-col h-[85vh]">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/40">
              <h3 className="text-sm font-bold text-foreground">
                {isPreviewMode ? 'Preview & Finalize Content' : 'Issue New Document / Certificate'}
              </h3>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all"
                onClick={() => setShowGenerateModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={isPreviewMode ? handleGenerate : handlePreview} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
                {!isPreviewMode ? (
                  <div className="space-y-4 max-w-lg mx-auto py-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Select Target Employee *</label>
                      <Select
                        options={employees.map((emp) => ({
                          value: String(emp.id),
                          label: `${emp.firstName || ''} ${emp.lastName || ''} (${emp.employeeId || emp.email || emp.id})`
                        }))}
                        onChange={(option) => setGenerateData((prev) => ({ ...prev, userId: option ? option.value : '' }))}
                        placeholder="Search Employee by Name/ID..."
                        isClearable
                        styles={selectStyles}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Select Document Template *</label>
                      <Select
                        options={templates.map((t) => ({ value: String(t.id), label: t.templateName }))}
                        onChange={(option) => setGenerateData((prev) => ({ ...prev, templateId: option ? option.value : '' }))}
                        placeholder="Search Templates..."
                        isClearable
                        styles={selectStyles}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date of Issue *</label>
                      <input
                        className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        type="date"
                        required
                        value={generateData.issuedDate}
                        onChange={(e) => setGenerateData((prev) => ({ ...prev, issuedDate: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 h-full flex flex-col">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Verify and Fine-tune Output Content</label>
                    <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card text-foreground">
                      <JoditEditor
                        ref={editorRef}
                        value={generateData.customHtml}
                        config={{
                          readonly: false,
                          height: 380,
                          showCharsCounter: false,
                          showWordsCounter: false,
                          showXPathInStatusbar: false
                        }}
                        onBlur={(newContent) => setGenerateData((prev) => ({ ...prev, customHtml: newContent }))}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2 select-none">
                      <input
                        type="checkbox"
                        id="sendEmail"
                        className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0"
                        checked={generateData.sendEmail}
                        onChange={(e) => setGenerateData((prev) => ({ ...prev, sendEmail: e.target.checked }))}
                      />
                      <label htmlFor="sendEmail" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                        Send PDF attachment directly to employee's email address
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border bg-muted/40 flex justify-between gap-2 text-xs">
                {isPreviewMode ? (
                  <button
                    type="button"
                    className="px-4 py-2 bg-background border border-input hover:bg-accent text-foreground font-semibold rounded-md"
                    onClick={() => setIsPreviewMode(false)}
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-background border border-input hover:bg-accent text-foreground font-semibold rounded-md"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Cancel
                  </button>
                  {!isPreviewMode ? (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md"
                      disabled={previewing}
                    >
                      {previewing ? 'Loading Preview...' : 'Preview & Edit'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-success hover:bg-success/90 text-primary-foreground font-semibold rounded-md"
                      disabled={generating}
                    >
                      {generating ? 'Generating PDF...' : 'Issue Document'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Overlay Modal */}
      {showVerifyModal && verifyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden shadow-lg flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/40">
              <h3 className="text-sm font-bold text-foreground">Security Verification</h3>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all"
                onClick={() => setShowVerifyModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 text-center text-xs space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Document Number</span>
                <p className="font-mono text-base font-bold text-foreground mt-1">{verifyData.certificateNo}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status Code</span>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${verifyData.status === 'ACTIVE'
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}
                  >
                    {verifyData.status === 'ACTIVE' ? <CheckCircle className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    {verifyData.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Public Verification link</span>
                <div className="mt-2 px-3 py-2 bg-background border border-border rounded-lg break-all font-mono text-[10px] text-primary">
                  <a
                    href={`${window.location.origin}/verify/${verifyData.verificationToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {`${window.location.origin}/verify/${verifyData.verificationToken}`}
                  </a>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-3">
                  Scan QR Verification Code
                </span>
                <div className="inline-block p-3 bg-card border border-border rounded-lg shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      `${window.location.origin}/verify/${verifyData.verificationToken}`
                    )}`}
                    alt="QR Verification code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-muted/40 flex justify-center text-xs">
              <button
                type="button"
                className="w-full py-2 bg-background hover:bg-accent border border-input text-foreground font-semibold rounded-md"
                onClick={() => setShowVerifyModal(false)}
              >
                Close Verification Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

