/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { Landmark, Globe, Briefcase, MapPin, Settings, Upload, AlertCircle } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';

interface CompanyProfileData {
  companyName: string;
  companyCode: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gstNumber: string;
  panNumber: string;
  registrationNumber: string;
  timezone: string;
  currency: string;
  logoUrl: string;
  faviconUrl: string;
  stampUrl: string;
  signatureUrl: string;
}

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [formData, setFormData] = useState<CompanyProfileData>({
    companyName: '',
    companyCode: '',
    email: '',
    phone: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    registrationNumber: '',
    timezone: '',
    currency: '',
    logoUrl: '',
    faviconUrl: '',
    stampUrl: '',
    signatureUrl: ''
  });

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchProfile = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.get<CompanyProfileData>('/company-profile', { signal, ignore403: true });
      if (res.data) {
        setFormData({
          companyName: res.data.companyName || '',
          companyCode: res.data.companyCode || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          website: res.data.website || '',
          addressLine1: res.data.addressLine1 || '',
          addressLine2: res.data.addressLine2 || '',
          city: res.data.city || '',
          state: res.data.state || '',
          country: res.data.country || '',
          pincode: res.data.pincode || '',
          gstNumber: res.data.gstNumber || '',
          panNumber: res.data.panNumber || '',
          registrationNumber: res.data.registrationNumber || '',
          timezone: res.data.timezone || '',
          currency: res.data.currency || '',
          logoUrl: res.data.logoUrl || '',
          faviconUrl: res.data.faviconUrl || '',
          stampUrl: res.data.stampUrl || '',
          signatureUrl: res.data.signatureUrl || ''
        });
      }
    } catch (err: unknown) {
      const axiosError = err as { name?: string; response?: { status?: number; data?: { message?: string } } };
      if (axiosError.name === 'CanceledError') return;
      if (axiosError.response?.status !== 204) {
        setError(axiosError.response?.data?.message || 'Failed to fetch company profile.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchProfile(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await rolesApi.put<CompanyProfileData>('/company-profile', formData, { ignore403: true });
      setFormData((prev) => ({ ...prev, ...res.data }));
      showToast('success', 'Company Profile updated successfully.');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to save company profile.');
      showToast('error', 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: 'logo' | 'favicon' | 'stamp' | 'signature', file: File | undefined) => {
    if (!file) return;
    setSaving(true);
    setError(null);

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      let endpoint = '';
      if (type === 'logo') endpoint = '/company-profile/logo';
      else if (type === 'favicon') endpoint = '/company-profile/favicon';
      else if (type === 'stamp') endpoint = '/company-profile/stamp';
      else if (type === 'signature') endpoint = '/company-profile/signature';

      const res = await rolesApi.post<Record<string, string>>(endpoint, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ignore403: true,
      });

      setFormData((prev) => ({
        ...prev,
        logoUrl: type === 'logo' ? res.data.logoUrl : prev.logoUrl,
        faviconUrl: type === 'favicon' ? res.data.faviconUrl : prev.faviconUrl,
        stampUrl: type === 'stamp' ? res.data.stampUrl : prev.stampUrl,
        signatureUrl: type === 'signature' ? res.data.signatureUrl : prev.signatureUrl
      }));

      showToast('success', `${type.toUpperCase()} image uploaded successfully.`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to upload branding image.');
      showToast('error', 'Image upload failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast notifications */}
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

      <EntityFormPage
        title="Company Profile"
        subtitle="Configure organization details, identity tags, billing registrations, branding resources, and timezone locales."
        onSubmit={handleSave}
        loading={loading}
        submitLabel={saving ? 'Saving Profile...' : 'Save Profile'}
      >
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 rounded-lg flex gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Section: Company Information */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4" /> Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Company Name *</label>
                <input
                  type="text"
                  required
                  name="companyName"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Company Code *</label>
                <input
                  type="text"
                  required
                  name="companyCode"
                  disabled={!!formData.companyCode}
                  placeholder="e.g. ACME"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  value={formData.companyCode}
                  onChange={handleChange}
                />
                <span className="text-[10px] text-muted-foreground block mt-1">Immutable configuration identifier code.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email Contact</label>
                <input
                  type="email"
                  name="email"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Website</label>
                  <input
                    type="url"
                    name="website"
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Branding assets uploads */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4" /> Branding Elements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Logo upload */}
              <div className="bg-muted/40 p-4 border border-border rounded-lg space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground">Corporate Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-background border border-border rounded-lg overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      'No Logo'
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer bg-background hover:bg-accent text-foreground font-semibold py-2 px-3 rounded-md border border-input text-center flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('logo', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Favicon upload */}
              <div className="bg-muted/40 p-4 border border-border rounded-lg space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground">Site Favicon</label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-background border border-border rounded-lg overflow-hidden flex items-center justify-center text-[9px] text-muted-foreground">
                    {formData.faviconUrl ? (
                      <img src={formData.faviconUrl} alt="Favicon" className="max-w-full max-h-full object-contain" />
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer bg-background hover:bg-accent text-foreground font-semibold py-2 px-3 rounded-md border border-input text-center flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('favicon', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Stamp Upload */}
              <div className="bg-muted/40 p-4 border border-border rounded-lg space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground">Authorized Company Stamp / Seal</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-background border border-border rounded-lg overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
                    {formData.stampUrl ? (
                      <img src={formData.stampUrl} alt="Stamp" className="max-w-full max-h-full object-contain" />
                    ) : (
                      'No Stamp'
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer bg-background hover:bg-accent text-foreground font-semibold py-2 px-3 rounded-md border border-input text-center flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Stamp
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('stamp', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Signature Upload */}
              <div className="bg-muted/40 p-4 border border-border rounded-lg space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground">Authorized Signatory Specimen</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-10 bg-background border border-border rounded-lg overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
                    {formData.signatureUrl ? (
                      <img src={formData.signatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                    ) : (
                      'No Signature'
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer bg-background hover:bg-accent text-foreground font-semibold py-2 px-3 rounded-md border border-input text-center flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Specimen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('signature', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Business Registrations */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Tax & Business Registrations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">GST Identification Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.gstNumber}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">PAN Identification Number</label>
                <input
                  type="text"
                  name="panNumber"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.panNumber}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Corporate Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section: Address Information */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Headquarter Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.addressLine1}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.addressLine2}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">City</label>
                  <input
                    type="text"
                    name="city"
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pincode / ZIP</label>
                  <input
                    type="text"
                    name="pincode"
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.pincode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Regional Locales */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4" /> Regional & Localization Locales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Default Timezone</label>
                <select
                  name="timezone"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.timezone}
                  onChange={handleChange}
                >
                  <option value="">Select Timezone...</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Default Currency</label>
                <select
                  name="currency"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="">Select Currency...</option>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </EntityFormPage>
    </div>
  );
}




