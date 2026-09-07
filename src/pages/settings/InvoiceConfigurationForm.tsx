import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  CheckCircle2,
  QrCode,
  Eye,
  Building2,
  Sparkles,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import rolesApi from '@/services/rolesApi';

interface InvoiceConfigForm {
  invoiceName: string;
  invoicePrefix: string;
  invoiceNumberFormat: string;
  companyLogo: string;
  companyDetails: string;
  gstTaxDetails: string;
  termsConditions: string;
  active: boolean;
  targetModule: string;
}

export default function InvoiceConfigurationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const prefill = location.state?.template;

  const [formData, setFormData] = useState<InvoiceConfigForm>({
    invoiceName: prefill?.name || '',
    invoicePrefix: prefill?.prefix || 'INV-',
    invoiceNumberFormat: prefill?.format || 'YYYYMMDD-000',
    companyLogo: '',
    companyDetails: '',
    gstTaxDetails: '',
    termsConditions: prefill?.terms || '',
    active: false,
    targetModule: 'ALL'
  });

  useEffect(() => {
    if (id) {
      const fetchConfig = async () => {
        try {
          const res = await rolesApi.get(`/invoice-configurations/${id}`);
          setFormData({
            invoiceName: res.data.invoiceName || '',
            invoicePrefix: res.data.invoicePrefix || '',
            invoiceNumberFormat: res.data.invoiceNumberFormat || '',
            companyLogo: res.data.companyLogo || '',
            companyDetails: res.data.companyDetails || '',
            gstTaxDetails: res.data.gstTaxDetails || '',
            termsConditions: res.data.termsConditions || '',
            active: res.data.active || false,
            targetModule: res.data.targetModule || 'ALL'
          });
          if (res.data.companyLogo && res.data.companyLogo.startsWith('http')) {
            setLogoInputMode('url');
          }
        } catch (error) {
          console.error('Error fetching configuration:', error);
          toast.error('Failed to load configuration');
          navigate('/settings/templates?tab=invoices');
        } finally {
          setFetching(false);
        }
      };
      fetchConfig();
    }
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);

    try {
      // 1. Convert to Base64 for instant client preview and offline persistence
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target?.result as string;
        setFormData(prev => ({ ...prev, companyLogo: base64Url }));

        // 2. Also attempt upload to backend API if available
        try {
          const uploadData = new FormData();
          uploadData.append('file', file);
          const res = await rolesApi.post('/company-profile/logo', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            ignore403: true,
          });
          if (res.data?.logoUrl) {
            setFormData(prev => ({ ...prev, companyLogo: res.data.logoUrl }));
          }
        } catch (uploadErr) {
          console.warn('Backend image upload endpoint not available, preserved as high-res Data URL:', uploadErr);
        }

        toast.success('Company logo uploaded successfully!');
        setUploadingLogo(false);
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        setUploadingLogo(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('Failed to process image');
      setUploadingLogo(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, companyLogo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Logo removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (id) {
        await rolesApi.put(`/invoice-configurations/${id}`, formData);
        toast.success('Configuration updated successfully');
      } else {
        await rolesApi.post('/invoice-configurations', formData);
        toast.success('Configuration created successfully');
      }
      navigate('/settings/templates?tab=invoices');
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast.error(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  // Sample dynamic values for Live Preview
  const sampleInvoiceNumber = `${formData.invoicePrefix || 'INV-'}${
    formData.invoiceNumberFormat
      ? formData.invoiceNumberFormat.replace(/YYYY/g, '2026').replace(/MM/g, '09').replace(/DD/g, '01').replace(/000/g, '042').replace(/00000/g, '00042')
      : '2026-0042'
  }`;

  const moduleDisplayNames: Record<string, string> = {
    ALL: 'Universal SaaS Template',
    VENDOR: 'Vendor Procurement Receipt',
    BILLING: 'Tenant Subscription Invoice',
    CUSTOMER: 'Customer Sales Invoice'
  };

  if (fetching) return <div className="p-8 text-center text-gray-500 font-sans">Loading configuration...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans max-w-[1600px] mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings/templates?tab=invoices')}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white text-gray-600 shadow-sm cursor-pointer"
            title="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {id ? 'Edit Configuration' : 'Create Configuration'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles size={12} className="text-indigo-600" />
                Live Designer
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">Customize company branding, numbering formats, and live preview</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings/templates?tab=invoices')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/20 font-bold text-sm disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save size={16} />
            )}
            {id ? 'Update Configuration' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left = Form, Right = Live Invoice Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Settings (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Basic Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" /> Basic Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Configuration Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="invoiceName"
                    required
                    value={formData.invoiceName}
                    onChange={handleChange}
                    placeholder="e.g. Standard SaaS Tax Invoice"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Target Module Assignment
                  </label>
                  <select
                    name="targetModule"
                    value={formData.targetModule}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="ALL">ALL (Universal Fallback Template)</option>
                    <option value="VENDOR">VENDOR (Procurement Receipts)</option>
                    <option value="BILLING">BILLING (Tenant Subscription Invoices)</option>
                    <option value="CUSTOMER">CUSTOMER (Customer Sales Invoices)</option>
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Module where this template will automatically render for generated invoices.
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    name="invoicePrefix"
                    value={formData.invoicePrefix}
                    onChange={handleChange}
                    placeholder="e.g. INV-"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Number Format
                  </label>
                  <input
                    type="text"
                    name="invoiceNumberFormat"
                    value={formData.invoiceNumberFormat}
                    onChange={handleChange}
                    placeholder="e.g. YYYYMMDD-000"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Branding & Styling (With Logo Upload + URL Support) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={18} className="text-indigo-600" /> Branding & Company Logo
                </h2>
                
                {/* Tabs to switch Upload vs URL */}
                <div className="inline-flex p-1 bg-gray-100 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                      logoInputMode === 'upload'
                        ? 'bg-white text-indigo-600 shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Upload size={13} /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                      logoInputMode === 'url'
                        ? 'bg-white text-indigo-600 shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LinkIcon size={13} /> Image URL
                  </button>
                </div>
              </div>

              {/* Upload Image Mode */}
              {logoInputMode === 'upload' ? (
                <div className="space-y-4">
                  {formData.companyLogo ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-14 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center overflow-hidden shadow-xs">
                          <img
                            src={formData.companyLogo}
                            alt="Company Logo Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 w-fit">
                            <CheckCircle2 size={12} /> Logo Selected
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Rendered dynamically on live preview & invoices</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw size={13} /> Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
                          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50/60'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                        {uploadingLogo ? (
                          <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <Upload size={22} />
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        Click to upload or drag and drop logo image
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, WebP, or SVG (Recommended: Transparent PNG or 300x100px)
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              ) : (
                /* URL Input Mode */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Direct Logo Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        name="companyLogo"
                        value={formData.companyLogo}
                        onChange={handleChange}
                        placeholder="https://yourcompany.com/assets/logo.png"
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                      />
                      {formData.companyLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                          title="Clear URL"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {formData.companyLogo && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3 w-fit max-w-sm">
                      <img src={formData.companyLogo} alt="Logo" className="h-8 max-w-[120px] object-contain rounded" />
                      <span className="text-xs text-gray-600 font-medium truncate">Preview from URL</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Content & Disclaimers */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" /> Content & Disclaimers
              </h2>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Company Details (Billed From Header)
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        companyDetails: "Acme Cloud Technologies Pvt Ltd\nFloor 4, Cyber City, Phase II\nBengaluru, KA - 560100\nEmail: accounts@acmecloud.io | Phone: +91 (80) 4567-8900"
                      }))}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Fill Sample
                    </button>
                  </div>
                  <textarea
                    name="companyDetails"
                    value={formData.companyDetails}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Company Legal Name&#10;Street Address, City, State, PIN&#10;Email: billing@example.com | Phone: +91 9876543210"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      GST, Tax & Banking Details
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        gstTaxDetails: "GSTIN: 29ABCDE1234F1Z5 | PAN: ABCDE1234F\nBank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234"
                      }))}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Fill Sample
                    </button>
                  </div>
                  <textarea
                    name="gstTaxDetails"
                    value={formData.gstTaxDetails}
                    onChange={handleChange}
                    rows={2}
                    placeholder="GSTIN: 36ABCDE1234F1Z5 | PAN: ABCDE1234F&#10;Bank Transfer: AC 1234567890 (IFSC: HDFC0001234)"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono text-xs"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Terms & Conditions / Footer Notes
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        termsConditions: "1. Payment is due within 15 calendar days from the invoice date.\n2. Invoices overdue after 30 days are subject to 1.5% monthly finance charge.\n3. All disputes are subject to local judicial jurisdiction."
                      }))}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Fill Sample
                    </button>
                  </div>
                  <textarea
                    name="termsConditions"
                    value={formData.termsConditions}
                    onChange={handleChange}
                    rows={4}
                    placeholder="1. Payment is due within 7 days.&#10;2. Late payments may incur an interest fee.&#10;3. Goods/services once supplied cannot be refunded."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Active Switch */}
            {!id && (
              <div className="flex items-center gap-3 bg-indigo-50/80 p-4 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="active" className="text-sm font-bold text-indigo-950 cursor-pointer select-none">
                  Set as Active Configuration immediately for {formData.targetModule} module
                </label>
              </div>
            )}

            {/* Bottom Submit Button */}
            <div className="flex justify-end pt-2 pb-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 font-bold disabled:opacity-50 text-sm active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Save size={18} />
                )}
                {id ? 'Update Configuration' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Invoice Preview (5 cols) */}
        <div className="xl:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Live Invoice Preview
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synchronized
            </div>
          </div>

          {/* Paper Mockup Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden font-sans text-xs text-gray-800">
            {/* Top color bar */}
            <div className="h-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800"></div>

            <div className="p-6 sm:p-7 space-y-6">
              {/* Header Section: Logo + Title */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-5">
                <div className="space-y-2 max-w-[60%]">
                  {formData.companyLogo ? (
                    <img
                      src={formData.companyLogo}
                      alt="Company Logo"
                      className="h-12 max-w-[170px] object-contain"
                    />
                  ) : (
                    <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-center text-gray-400 font-bold text-[11px] flex items-center gap-1.5 w-fit">
                      <ImageIcon size={14} className="text-gray-400" />
                      <span>[ Corporate Logo ]</span>
                    </div>
                  )}

                  <h3 className="text-xl font-black uppercase text-gray-900 tracking-tight leading-none pt-1">
                    {formData.invoiceName || 'TAX INVOICE'}
                  </h3>
                  
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                    {moduleDisplayNames[formData.targetModule] || formData.targetModule}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[10px] font-bold uppercase text-gray-400">Invoice Number</div>
                  <div className="font-mono font-black text-gray-900 text-sm">{sampleInvoiceNumber}</div>
                  
                  <div className="text-[10px] font-bold uppercase text-gray-400 pt-1">Date</div>
                  <div className="font-semibold text-gray-700 text-xs">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>

                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      <CheckCircle2 size={10} /> Paid
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed From / Billed To Section */}
              <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-100 pb-1">
                    Billed From
                  </h4>
                  {formData.companyDetails ? (
                    <div className="text-gray-800 font-medium whitespace-pre-line">
                      {formData.companyDetails}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">
                      Acme Technologies Pvt Ltd<br />
                      Tech Gateway, Sector 4<br />
                      Bengaluru, Karnataka - 560100<br />
                      billing@acme.com
                    </div>
                  )}
                  
                  {formData.gstTaxDetails && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] font-mono text-gray-700 whitespace-pre-line bg-gray-50 p-1.5 rounded">
                      {formData.gstTaxDetails}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-100 pb-1">
                    Billed To
                  </h4>
                  <div className="text-gray-800 font-semibold">Global Enterprise Client Ltd</div>
                  <div className="text-gray-600">
                    Tower 8, Cyber Park<br />
                    Mumbai, Maharashtra - 400051<br />
                    finance@globalclient.com
                  </div>
                  <div className="mt-2 text-[10px] text-gray-500 font-mono">
                    GSTIN: 27AABCG9876K1Z3
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-white font-bold text-[10px] uppercase">
                      <th className="px-3 py-2 rounded-tl-lg">Description</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right rounded-tr-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 border-b border-gray-900">
                    <tr className="bg-white">
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-gray-900">Enterprise Cloud License</div>
                        <div className="text-[10px] text-gray-500">Tier-1 Annual Subscription Access</div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-700 font-semibold">1</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">₹25,000.00</td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-900">₹25,000.00</td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-gray-900">Dedicated Support & SLAs</div>
                        <div className="text-[10px] text-gray-500">24/7 Priority Support Coverage</div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-700 font-semibold">1</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">₹5,000.00</td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-900">₹5,000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals & Calculations */}
              <div className="flex justify-between items-start gap-4 pt-1">
                <div className="w-1/2 space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <QrCode size={36} className="text-gray-800 flex-shrink-0" strokeWidth={1.5} />
                    <div className="text-[9px] text-gray-500 leading-tight">
                      <span className="font-bold text-gray-700 block">Scan to Verify</span>
                      Authenticity verified via Secure Ledger
                    </div>
                  </div>
                </div>

                <div className="w-1/2 space-y-1.5 text-right text-[11px]">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-gray-900 font-mono">₹30,000.00</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST + SGST (18%):</span>
                    <span className="font-bold text-gray-900 font-mono">₹5,400.00</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-900 pt-2 border-t-2 border-gray-900">
                    <span className="font-black uppercase text-xs">Total Amount:</span>
                    <span className="font-black text-sm text-indigo-700 font-mono">₹35,400.00</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions / Signatory */}
              <div className="pt-3 border-t border-gray-200 text-[10px] space-y-3">
                {formData.termsConditions ? (
                  <div>
                    <span className="font-bold text-gray-700 uppercase tracking-wider block mb-0.5">
                      Terms & Conditions:
                    </span>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                      {formData.termsConditions}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                      Terms & Conditions:
                    </span>
                    <p className="text-gray-400 italic">
                      1. Payment is due within standard billing cycle.<br />
                      2. Thank you for your business.
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-end pt-3 text-[10px] text-gray-500">
                  <span>Authorized System Generated Receipt</span>
                  <div className="text-center">
                    <div className="w-28 border-b border-gray-400 mb-1"></div>
                    <span className="font-semibold text-gray-600">Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



