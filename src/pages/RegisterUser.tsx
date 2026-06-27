import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import rolesApi from '@/services/rolesApi';

interface RegisterResponse {
  token?: string;
}

export default function RegisterUser() {
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (tenantName.length < 3) errors.tenantName = "Tenant name must be at least 3 characters";
    if (tenantCode && !/^[A-Z0-9_]+$/.test(tenantCode)) errors.tenantCode = "Tenant code must use only A-Z, 0-9 or underscore";
    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!/^[a-zA-Z0-9.\-_]+@gmail\.com$/.test(email)) errors.email = "Email must be a valid Gmail address";
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(password)) errors.password = "Password must include one uppercase, one lowercase, one digit, and one special char";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setMessage(null);
    setError(null);
    setLoading(true);

    const payload = {
      tenantName,
      tenantCode: tenantCode || null,
      firstName,
      lastName,
      email,
      password,
    };

    try {
      const response = await rolesApi.post<RegisterResponse>('/auth/register', payload);
      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        setMessage('Tenant Admin Registration Successful! Token stored in localStorage.');
      } else {
        setMessage('Tenant Admin Registered successfully!');
      }
      // Reset form
      setTenantName('');
      setTenantCode('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: any }; message?: string };
      let errorMsg = 'Registration failed. Please try again.';

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-slate-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl font-bold text-slate-50">Register Tenant & Admin User</h2>
          <p className="text-slate-400 mt-2">Initialize workspace and administrative accounts</p>
        </div>

        {message && <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl mb-6 border border-emerald-500/20 text-sm relative z-10">{message}</div>}
        {error && <div className="bg-rose-500/10 text-rose-400 p-3 rounded-xl mb-6 border border-rose-500/20 text-sm relative z-10">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tenant Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                className={`w-full bg-slate-950/50 border ${formErrors.tenantName ? 'border-rose-500' : 'border-slate-700'} text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-600 text-sm`}
                value={tenantName}
                onChange={(e) => { setTenantName(e.target.value); setFormErrors(prev => ({ ...prev, tenantName: '' })) }}
              />
              {formErrors.tenantName && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.tenantName}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tenant Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. ACM"
                className={`w-full bg-slate-950/50 border ${formErrors.tenantCode ? 'border-rose-500' : 'border-slate-700'} text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-600 text-sm`}
                value={tenantCode}
                onChange={(e) => { setTenantCode(e.target.value.toUpperCase()); setFormErrors(prev => ({ ...prev, tenantCode: '' })) }}
              />
              {formErrors.tenantCode && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.tenantCode}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">First Name</label>
              <input
                type="text"
                required
                placeholder="First Name"
                className={`w-full bg-slate-950/50 border ${formErrors.firstName ? 'border-rose-500' : 'border-slate-700'} text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-600 text-sm`}
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setFormErrors(prev => ({ ...prev, firstName: '' })) }}
              />
              {formErrors.firstName && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.firstName}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
              <input
                type="text"
                required
                placeholder="Last Name"
                className={`w-full bg-slate-950/50 border ${formErrors.lastName ? 'border-rose-500' : 'border-slate-700'} text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-600 text-sm`}
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setFormErrors(prev => ({ ...prev, lastName: '' })) }}
              />
              {formErrors.lastName && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.lastName}</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Email</label>
            <input
              type="email"
              required
              placeholder="admin@gmail.com"
              className={`w-full bg-slate-950/50 border ${formErrors.email ? 'border-rose-500' : 'border-slate-700'} text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-600 text-sm`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: '' })) }}
            />
            {formErrors.email && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.email}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Password</label>
            <input
              type="password"
              required
              placeholder="Password"
              className={`w-full bg-slate-950/50 border ${formErrors.password ? 'border-rose-500' : 'border-slate-700'} text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-600 text-sm`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFormErrors(prev => ({ ...prev, password: '' })) }}
            />
            {formErrors.password && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-4"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-6 relative z-10 text-sm">
          <span className="text-slate-400">
            Need to sign in? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign In</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

