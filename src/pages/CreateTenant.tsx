import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, UserCheck, ShieldAlert } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';

interface CreateTenantProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function CreateTenant({ onClose, onSuccess }: CreateTenantProps = {}) {
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (tenantName.length < 3) errors.tenantName = "Tenant name must be at least 3 characters";
    if (!tenantCode) errors.tenantCode = "Tenant code is required";
    else if (!/^[A-Z0-9_]+$/.test(tenantCode)) errors.tenantCode = "Tenant code must use only A-Z, 0-9 or underscore";
    if (!adminFirstName) errors.adminFirstName = "Admin first name is required";
    if (!adminLastName) errors.adminLastName = "Admin last name is required";
    if (!/^[a-zA-Z0-9.\-_]+@gmail\.com$/.test(adminEmail)) errors.adminEmail = "Email must be a Gmail address";
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(adminPassword)) errors.adminPassword = "Password must include one uppercase, one lowercase, one digit, and one special char";
    if (!/^\d{10}$/.test(phone)) errors.phone = "Phone number must be exactly 10 digits";
    if (!databaseName) errors.databaseName = "Database name is required";
    else if (!/^[A-Za-z0-9_]+$/.test(databaseName)) errors.databaseName = "Database name can only contain letters, digits, or underscore";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      tenantName,
      tenantCode: tenantCode || null,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      phone,
      databaseName,
    };

    try {
      await rolesApi.post('/tenants', payload);
      showToast('success', 'Tenant and admin profile created successfully!');
      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      } else {
        setTimeout(() => {
          navigate('/tenants');
        }, 1500);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } | string }; message?: string };
      let errorMsg = 'Failed to create tenant workspace.';
      if (axiosError.response) {
        if (typeof axiosError.response.data === 'object' && axiosError.response.data?.message) {
          errorMsg = axiosError.response.data.message;
        } else if (typeof axiosError.response.data === 'string') {
          errorMsg = axiosError.response.data;
        }
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }

      // Try to parse backend validation errors (Map<String, String>)
      if (axiosError.response && typeof axiosError.response.data === 'object') {
        const data = axiosError.response.data as any;
        if (data.errors) {
          setFormErrors(data.errors);
          errorMsg = "Please correct the highlighted errors.";
        }
      }

      showToast('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={onClose ? "w-full" : "max-w-4xl mx-auto space-y-6"}>
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

      {/* Onboarding Header Banner */}
      {!onClose && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">Onboard New Tenant Workspace</h2>
            <p className="text-slate-400 text-xs">
              Provision a new logically isolated database instance and map the initial Super Admin profile.
            </p>
          </div>
        </div>
      )}

      <EntityFormPage
        title="Create Tenant Workspace"
        onSubmit={handleSubmit}
        loading={loading}
        isModal={Boolean(onClose)}
        onBack={onClose}
      >
        <div className="space-y-6">
          {/* Section: Company Profile details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4" /> Workspace Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tenant/Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  className={`w-full bg-background border ${formErrors.tenantName ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  value={tenantName}
                  onChange={(e) => { setTenantName(e.target.value); setFormErrors(prev => ({ ...prev, tenantName: '' })) }}
                />
                {formErrors.tenantName && <span className="text-[10px] text-rose-500 block mt-1">{formErrors.tenantName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tenant Code (Identifier)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ACM"
                  className={`w-full bg-background border ${formErrors.tenantCode ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  value={tenantCode}
                  onChange={(e) => { setTenantCode(e.target.value.toUpperCase()); setFormErrors(prev => ({ ...prev, tenantCode: '' })) }}
                />
                {formErrors.tenantCode ? (
                  <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.tenantCode}</span>
                ) : (
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Uppercase string used as routing header code.
                  </span>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Database Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme_db"
                  className={`w-full bg-background border ${formErrors.databaseName ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  value={databaseName}
                  onChange={(e) => { setDatabaseName(e.target.value); setFormErrors(prev => ({ ...prev, databaseName: '' })) }}
                />
                {formErrors.databaseName && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.databaseName}</span>}
              </div>
            </div>
          </div>

          <hr className="border-slate-850" />

          {/* Section: Admin User Account credentials */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Tenant Administrator Profile
            </h3>

            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl text-amber-400/90 text-xs flex gap-3 mb-4">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="font-bold">System Privilege Notice:</span> This administrator account will be granted full `SUPER_ADMIN` system credentials for the new isolated database tenant.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Admin First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rahul"
                  className={`w-full bg-background border ${formErrors.adminFirstName ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  value={adminFirstName}
                  onChange={(e) => { setAdminFirstName(e.target.value); setFormErrors(prev => ({ ...prev, adminFirstName: '' })) }}
                />
                {formErrors.adminFirstName && <span className="text-[10px] text-rose-500 block mt-1">{formErrors.adminFirstName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Admin Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sharma"
                  className={`w-full bg-background border ${formErrors.adminLastName ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  value={adminLastName}
                  onChange={(e) => { setAdminLastName(e.target.value); setFormErrors(prev => ({ ...prev, adminLastName: '' })) }}
                />
                {formErrors.adminLastName && <span className="text-[10px] text-rose-500 block mt-1">{formErrors.adminLastName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Admin Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@acme.com"
                  className={`w-full bg-background border ${formErrors.adminEmail ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  value={adminEmail}
                  onChange={(e) => { setAdminEmail(e.target.value); setFormErrors(prev => ({ ...prev, adminEmail: '' })) }}
                />
                {formErrors.adminEmail && <span className="text-[10px] text-rose-500 block mt-1">{formErrors.adminEmail}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Admin Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className={`w-full bg-background border ${formErrors.adminPassword ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setFormErrors(prev => ({ ...prev, adminPassword: '' })) }}
                />
                {formErrors.adminPassword && <span className="text-[10px] text-rose-500 block mt-1">{formErrors.adminPassword}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Admin Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="1234567890"
                  className={`w-full bg-background border ${formErrors.phone ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setFormErrors(prev => ({ ...prev, phone: '' })) }}
                />
                {formErrors.phone && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </EntityFormPage>
    </div>
  );
}

