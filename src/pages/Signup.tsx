import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import rolesApi from '@/services/rolesApi';

export default function Signup() {
  const navigate = useNavigate();
  
  const [tenantName, setTenantName] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live password match state
  const passwordsMatch = confirmPassword.length > 0 && adminPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && adminPassword !== confirmPassword;

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (tenantName.length < 3) errors.tenantName = "Company name must be at least 3 characters";
    if (!adminFirstName) errors.adminFirstName = "First name is required";
    if (!adminLastName) errors.adminLastName = "Last name is required";
    if (!/^[a-zA-Z0-9.\-_]+@gmail\.com$/.test(adminEmail)) errors.adminEmail = "Email must be a valid Gmail address";
    if (!/^\d{10}$/.test(phone)) errors.phone = "Phone number must be exactly 10 digits";
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(adminPassword)) errors.adminPassword = "Password must include one uppercase, one lowercase, one digit, and one special char";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (adminPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    
    setMessage(null);
    setError(null);
    setLoading(true);

    const generatedCode = tenantName.toUpperCase().replace(/[^A-Z0-9_]/g, '').substring(0, 10);
    const generatedDbName = tenantName.toLowerCase().replace(/[^a-z0-9_]/g, '') + '_db';

    const payload = {
      tenantName,
      tenantCode: generatedCode || 'TENANT1',
      databaseName: generatedDbName || 'default_db',
      adminFirstName,
      adminLastName,
      adminEmail,
      phone,
      adminPassword,
    };

    try {
      await rolesApi.post('/auth/register-company', payload);
      setMessage('Company registered successfully! Your 15-Day Trial has started.');
      setTimeout(() => navigate('/login'), 2500);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-foreground">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 mb-3 tracking-wider">
            15-DAY FREE TRIAL
          </span>
          <h2 className="text-2xl font-bold text-foreground">Register Your Company</h2>
          <p className="text-muted-foreground mt-2">Create your workspace and start your trial today</p>
        </div>

        {message && <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl mb-6 border border-emerald-500/20 text-sm relative z-10">{message}</div>}
        {error && <div className="bg-rose-500/10 text-rose-400 p-3 rounded-xl mb-6 border border-rose-500/20 text-sm relative z-10">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4 relative z-10">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corp"
              className={`w-full bg-background border ${formErrors.tenantName ? 'border-rose-500' : 'border-border'} text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-muted-foreground text-sm`}
              value={tenantName}
              onChange={(e) => { setTenantName(e.target.value); setFormErrors(prev => ({...prev, tenantName: ''})) }}
            />
            {formErrors.tenantName && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.tenantName}</span>}
          </div>

          {/* First / Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
              <input
                type="text"
                required
                placeholder="John"
                className={`w-full bg-background border ${formErrors.adminFirstName ? 'border-rose-500' : 'border-border'} text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-muted-foreground text-sm`}
                value={adminFirstName}
                onChange={(e) => { setAdminFirstName(e.target.value); setFormErrors(prev => ({...prev, adminFirstName: ''})) }}
              />
              {formErrors.adminFirstName && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.adminFirstName}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
              <input
                type="text"
                required
                placeholder="Doe"
                className={`w-full bg-background border ${formErrors.adminLastName ? 'border-rose-500' : 'border-border'} text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-muted-foreground text-sm`}
                value={adminLastName}
                onChange={(e) => { setAdminLastName(e.target.value); setFormErrors(prev => ({...prev, adminLastName: ''})) }}
              />
              {formErrors.adminLastName && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.adminLastName}</span>}
            </div>
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Work Email</label>
              <input
                type="email"
                required
                placeholder="john@gmail.com"
                className={`w-full bg-background border ${formErrors.adminEmail ? 'border-rose-500' : 'border-border'} text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-muted-foreground text-sm`}
                value={adminEmail}
                onChange={(e) => { setAdminEmail(e.target.value); setFormErrors(prev => ({...prev, adminEmail: ''})) }}
              />
              {formErrors.adminEmail && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.adminEmail}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="1234567890"
                className={`w-full bg-background border ${formErrors.phone ? 'border-rose-500' : 'border-border'} text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-muted-foreground text-sm`}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setFormErrors(prev => ({...prev, phone: ''})) }}
              />
              {formErrors.phone && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.phone}</span>}
            </div>
          </div>

          {/* Password with show/hide */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className={`w-full bg-background border ${formErrors.adminPassword ? 'border-rose-500' : 'border-border'} text-foreground rounded-xl px-4 py-2.5 pr-11 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-muted-foreground text-sm`}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setFormErrors(prev => ({...prev, adminPassword: '', confirmPassword: ''}));
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formErrors.adminPassword && (
              <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.adminPassword}</span>
            )}
          </div>

          {/* Confirm Password with show/hide + live match indicator */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className={`w-full bg-background border ${
                  formErrors.confirmPassword
                    ? 'border-rose-500'
                    : passwordsMatch
                    ? 'border-emerald-500'
                    : passwordsMismatch
                    ? 'border-rose-500'
                    : 'border-border'
                } text-foreground rounded-xl px-4 py-2.5 pr-20 focus:outline-none focus:ring-1 ${
                  passwordsMatch
                    ? 'focus:ring-emerald-500 focus:border-emerald-500'
                    : 'focus:ring-cyan-500 focus:border-cyan-500'
                } transition-all placeholder:text-muted-foreground text-sm`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormErrors(prev => ({...prev, confirmPassword: ''}));
                }}
              />
              {/* Match / Mismatch icon */}
              {confirmPassword.length > 0 && (
                <span className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
                  {passwordsMatch
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-rose-500" />
                  }
                </span>
              )}
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword(v => !v)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Live feedback */}
            {confirmPassword.length > 0 && (
              <span
                className={`text-[10px] block mt-1 font-medium ${passwordsMatch ? 'text-emerald-500' : 'text-rose-500'}`}
                aria-live="polite"
              >
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </span>
            )}
            {formErrors.confirmPassword && confirmPassword.length === 0 && (
              <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.confirmPassword}</span>
            )}
          </div>

          {/* Submit - disabled until passwords match */}
          <button
            type="submit"
            disabled={loading || passwordsMismatch}
            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-4"
          >
            {loading ? 'Setting up your workspace...' : 'Start Free Trial'}
          </button>
        </form>

        <div className="text-center mt-6 relative z-10 text-sm">
          <span className="text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Sign In
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}



