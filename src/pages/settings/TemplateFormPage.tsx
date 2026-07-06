/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Image, Eye, Layers } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';
import JoditEditor from 'jodit-react';

interface TemplateFormData {
  templateCode: string;
  templateName: string;
  templateType: 'DOCUMENT' | 'CERTIFICATE' | 'INVOICE';
  contentHtml: string;
  backgroundImageUrl: string;
  active: boolean;
}

const PLACEHOLDER_GROUPS = [
  {
    label: '🖼 Company Images',
    image: true,
    placeholders: ['COMPANY_LOGO', 'COMPANY_SIGNATURE', 'COMPANY_STAMP', 'HEADER_IMAGE', 'FOOTER_IMAGE']
  },
  {
    label: '🏢 Company info',
    placeholders: ['COMPANY_NAME', 'COMPANY_ADDRESS']
  },
  {
    label: '👤 Employee details',
    placeholders: [
      'EMPLOYEE_NAME', 'EMPLOYEE_ID', 'EMPLOYEE_ADDRESS',
      'DESIGNATION', 'DEPARTMENT', 'WORK_LOCATION',
      'JOINING_DATE', 'EMPLOYMENT_TYPE', 'PROBATION_PERIOD',
      'ANNUAL_CTC', 'REPORTING_MANAGER', 'RELIEVING_DATE'
    ]
  },
  {
    label: '📄 Document parameters',
    placeholders: ['DOCUMENT_NO', 'ISSUE_DATE', 'START_DATE', 'END_DATE', 'EFFECTIVE_DATE']
  },
  {
    label: '🔄 Changes & Warnings',
    placeholders: [
      'OLD_DESIGNATION', 'NEW_DESIGNATION',
      'OLD_LOCATION', 'NEW_LOCATION', 'TRANSFER_DATE', 'WARNING_REASON'
    ]
  },
  {
    label: '🎓 Trainings',
    placeholders: ['COURSE_NAME', 'COMPLETION_DATE', 'TRAINING_NAME', 'ACHIEVEMENT_NAME', 'EVENT_NAME', 'EVENT_DATE']
  },
  {
    label: '✍️ Specimen Signatory',
    placeholders: ['SIGNATORY_NAME', 'SIGNATORY_DESIGNATION']
  },
  {
    label: '💵 Invoices & Billing',
    placeholders: [
      'INVOICE_NUMBER', 'CUSTOMER_NAME', 'CUSTOMER_ADDRESS',
      'INVOICE_ITEMS', 'SUBTOTAL', 'TAX_AMOUNT', 'TOTAL_AMOUNT'
    ]
  },
  {
    label: '🔍 QR Verification',
    placeholders: ['QR_CODE', 'VERIFICATION_URL']
  }
];

const IMAGE_PLACEHOLDERS = new Set(['COMPANY_LOGO', 'COMPANY_SIGNATURE', 'COMPANY_STAMP', 'HEADER_IMAGE', 'FOOTER_IMAGE']);

interface ImageMeta {
  width: string | number;
  label: string;
}

const IMAGE_SIZES: Record<string, ImageMeta> = {
  COMPANY_LOGO: { width: 150, label: 'Company Logo' },
  COMPANY_SIGNATURE: { width: 120, label: 'Signature' },
  COMPANY_STAMP: { width: 100, label: 'Stamp' },
  HEADER_IMAGE: { width: '100%', label: 'Header Banner' },
  FOOTER_IMAGE: { width: '100%', label: 'Footer Banner' },
};

const sampleData: Record<string, string> = {
  COMPANY_NAME: 'Sample Company Ltd.',
  COMPANY_ADDRESS: '123 Business Rd',
  EMPLOYEE_NAME: 'John Doe',
  EMPLOYEE_ID: 'EMP-001',
  EMPLOYEE_ADDRESS: '456 Home St',
  DESIGNATION: 'Software Engineer',
  DEPARTMENT: 'Engineering',
  WORK_LOCATION: 'Head Office',
  JOINING_DATE: '2026-01-01',
  EMPLOYMENT_TYPE: 'Full-time',
  PROBATION_PERIOD: '6 Months',
  ANNUAL_CTC: '₹100,000',
  REPORTING_MANAGER: 'Jane Smith',
  RELIEVING_DATE: '2026-06-01',
  DOCUMENT_NO: 'DOC-2026-001',
  ISSUE_DATE: new Date().toLocaleDateString(),
  START_DATE: '2025-01-01',
  END_DATE: '2026-01-01',
  EFFECTIVE_DATE: '2026-01-01',
  OLD_DESIGNATION: 'Junior Engineer',
  NEW_DESIGNATION: 'Senior Engineer',
  OLD_LOCATION: 'Branch A',
  NEW_LOCATION: 'Head Office',
  TRANSFER_DATE: '2026-02-01',
  WARNING_REASON: 'Attendance issues',
  COURSE_NAME: 'Advanced React',
  COMPLETION_DATE: '2026-05-01',
  TRAINING_NAME: 'Security Training',
  ACHIEVEMENT_NAME: 'Employee of the Year',
  EVENT_NAME: 'Tech Fest',
  EVENT_DATE: '2026-05-15',
  SIGNATORY_NAME: 'Alice Director',
  SIGNATORY_DESIGNATION: 'Managing Director',
  INVOICE_NUMBER: 'INV-2026-0001',
  CUSTOMER_NAME: 'Acme Corporation',
  CUSTOMER_ADDRESS: '456 Client Avenue, Business District',
  INVOICE_ITEMS: '<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">Consulting Services</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">1</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹1000.00</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹1000.00</td></tr>',
  SUBTOTAL: '₹1000.00',
  TAX_AMOUNT: '₹100.00',
  TOTAL_AMOUNT: '₹1100.00',
  QR_CODE: '[QR-CODE]',
  VERIFICATION_URL: 'https://verify.example.com/abc123'
};

export default function TemplateFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [formData, setFormData] = useState<TemplateFormData>({
    templateCode: '',
    templateName: '',
    templateType: 'DOCUMENT',
    contentHtml: '',
    backgroundImageUrl: '',
    active: true
  });

  const editorRef = useRef<any>(null);
  const contentRef = useRef<string>('');

  const editorConfig = useMemo(() => ({
    readonly: false,
    height: 450,
    uploader: {
      insertImageAsBase64URI: true
    },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'left', 'center', 'right', 'justify', '|',
      'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize', 'source'
    ]
  }), []);

  useEffect(() => {
    if (isEdit && id) {
      const fetchTemplate = async () => {
        setLoading(true);
        try {
          const res = await rolesApi.get<TemplateFormData>(`/templates/${id}`, { ignore403: true });
          setFormData({
            templateCode: res.data.templateCode || '',
            templateName: res.data.templateName || '',
            templateType: res.data.templateType || 'DOCUMENT',
            contentHtml: res.data.contentHtml || '',
            backgroundImageUrl: res.data.backgroundImageUrl || '',
            active: res.data.active !== false
          });
          contentRef.current = res.data.contentHtml || '';
        } catch (err: unknown) {
          const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
          setError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch template.');
        } finally {
          setLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await rolesApi.post<{ url: string }>('/templates/upload-background', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ignore403: true,
      });
      setFormData((prev) => ({ ...prev, backgroundImageUrl: res.data.url || '' }));
    } catch {
      alert('Failed to upload background image');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const latestContent = contentRef.current || formData.contentHtml;
    const dataToSave = { ...formData, contentHtml: latestContent };

    try {
      if (isEdit && id) {
        await rolesApi.put(`/templates/${id}`, dataToSave, { ignore403: true });
      } else {
        await rolesApi.post('/templates', dataToSave, { ignore403: true });
      }
      navigate('/settings/templates');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const getPreviewHtml = () => {
    let html = formData.contentHtml;
    for (const [key, value] of Object.entries(sampleData)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, `<span class="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-xs font-semibold">${value}</span>`);
    }
    return html;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/settings/templates')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to templates list
        </button>
      </div>

      <EntityFormPage
        title={isEdit ? 'Edit Document Template' : 'Create Document Template'}
        subtitle="Design professional layout templates with automated tags and variables. Configure margins, signature specs, and layouts."
        onSubmit={handleSave}
        loading={loading}
        submitLabel={saving ? 'Saving...' : 'Save Template'}
      >
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 rounded-lg flex gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Section: Config settings */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> Template Details
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0"
                  checked={formData.active}
                  onChange={handleChange}
                />
                <label htmlFor="active" className="text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                  Active
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Template Type *</label>
                <select
                  name="templateType"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.templateType}
                  onChange={handleChange}
                  required
                >
                  <option value="DOCUMENT">DOCUMENT</option>
                  <option value="CERTIFICATE">CERTIFICATE</option>
                  <option value="INVOICE">INVOICE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Template Code *</label>
                <input
                  type="text"
                  name="templateCode"
                  required
                  disabled={isEdit}
                  placeholder="e.g. JOINING_LETTER"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  value={formData.templateCode}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Template Name *</label>
                <input
                  type="text"
                  name="templateName"
                  required
                  placeholder="e.g. Official Joining Contract"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.templateName}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Background Watermark / Border URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    name="backgroundImageUrl"
                    placeholder="https://example.com/certificate-border.png"
                    className="flex-1 bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    value={formData.backgroundImageUrl}
                    onChange={handleChange}
                  />
                  <label className="cursor-pointer bg-background border border-input text-foreground px-3 rounded-lg flex items-center justify-center gap-1.5 hover:bg-accent text-[11px] font-semibold transition-all">
                    <Image className="w-3.5 h-3.5" />
                    Browse Background Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBackgroundUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Split Editor Layout */}
          <div className="bg-card border border-border rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-4 shadow-sm">
            <div className="lg:col-span-3 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-foreground">Design Canvas</h4>
                <button
                  type="button"
                  className="px-3 py-1.5 border border-input rounded-md bg-background hover:bg-accent text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all"
                  onClick={() => setPreviewOpen((prev) => !prev)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {previewOpen ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden bg-card text-foreground">
                <JoditEditor
                  ref={editorRef}
                  value={formData.contentHtml}
                  config={editorConfig}
                  onBlur={(newContent) => {
                    contentRef.current = newContent;
                    setFormData((prev) => ({ ...prev, contentHtml: newContent }));
                  }}
                  onChange={(newContent) => {
                    contentRef.current = newContent;
                  }}
                />
              </div>

              {previewOpen && (
                <div className="border border-border rounded-lg p-6 bg-muted/40 space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Document Output Preview
                  </span>
                  <div
                    className="bg-card border border-border rounded-md p-8 text-slate-900 min-h-[400px] leading-relaxed shadow-sm"
                    style={{
                      backgroundImage: formData.backgroundImageUrl ? `url(${formData.backgroundImageUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              )}
            </div>

            {/* Sidebar Tokens Panel */}
            <div className="bg-muted/40 border-t lg:border-t-0 lg:border-l border-border p-5 space-y-4 max-h-[600px] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Dynamic Placeholders</h4>
                <p className="text-[10px] text-muted-foreground mt-1">Insert template variables at current cursor location</p>
              </div>

              <div className="space-y-4">
                {PLACEHOLDER_GROUPS.map((group) => (
                  <div key={group.label} className="space-y-1.5">
                    <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">
                      {group.label}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {group.placeholders.map((key) => {
                        const isImage = IMAGE_PLACEHOLDERS.has(key);
                        const imgMeta = IMAGE_SIZES[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`w-full text-left font-mono text-[10px] px-2.5 py-1.5 rounded-lg border text-ellipsis overflow-hidden transition-all text-xs active:scale-95 ${
                              isImage
                                ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                                : 'bg-background border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                            onClick={() => {
                              const jodit = editorRef.current?.editor;
                              const htmlToInsert = isImage
                                ? `<img src="https://placehold.co/${imgMeta.width}x60?text=${encodeURIComponent(imgMeta.label)}" data-variable="${key}" width="${imgMeta.width}" style="max-width:100%;border:1px dashed #6c757d;cursor:pointer;" alt="${imgMeta.label}" />`
                                : `{{${key}}}`;

                              if (jodit?.selection) {
                                jodit.selection.insertHTML(htmlToInsert);
                                contentRef.current = jodit.value;
                              } else {
                                const updated = (contentRef.current || formData.contentHtml) + htmlToInsert;
                                contentRef.current = updated;
                                setFormData((prev) => ({ ...prev, contentHtml: updated }));
                              }
                            }}
                          >
                            {isImage ? `🖼 ${key}` : `{{${key}}}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </EntityFormPage>
    </div>
  );
}




