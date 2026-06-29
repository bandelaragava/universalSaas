import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import rolesApi from '@/services/rolesApi';
import Modal from '@/components/ui/Modal';

interface LoginResponse {
  token: string;
  tenantCode?: string;
  roleName?: string;
  permissions: string[];
  modules: string[];
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useAuth();
  const { setCurrentUser } = useAppStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {

      const response = await rolesApi.post<LoginResponse>('/auth/login', {
        email,
        password
      });

      const { token, tenantCode: respTenantCode, tenant_code, roleName, permissions, modules } = response.data as any;
      
      const finalTenantCode = respTenantCode || tenant_code;
      
      console.log("Login API response permissions count:", permissions?.length || 0);
      console.log("Login API response modules count:", modules?.length || 0);
      console.log("permissions passed to auth.login:", permissions);
      console.log("modules passed to auth.login:", modules);
      
      // We pass exactly what the backend gives us. No fallbacks.
      authLogin(token, permissions, modules, finalTenantCode, roleName);
      
      const isVendor = roleName && roleName.toUpperCase() === 'VENDOR';
      const storeRole = isVendor ? 'VENDOR' : 'STAFF';
      setCurrentUser(email, storeRole);
      
      if (storeRole === 'VENDOR') {
        navigate('/vendor-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errMsg = axiosError.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-slate-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 mb-4 shadow-lg shadow-cyan-500/10 border border-cyan-500/20">
            <span className="text-3xl font-bold text-cyan-400">V</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-50">Welcome Back</h2>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        <Modal isOpen={!!error} onClose={() => setError('')} title="Login Failed">
          <div className="text-center text-slate-300 p-4">
            <p className="mb-6 text-rose-400">{error}</p>
            <button 
              onClick={() => setError('')}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </Modal>

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center mt-8 relative z-10">
          <span className="text-slate-400 text-sm">
            Don't have an account? <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign Up</Link>
          </span>
        </div>
      </div>
    </div>
  );
}


