import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import rolesApi from '@/services/rolesApi';

interface VerificationData {
  status: 'ACTIVE' | 'REVOKED' | string;
  certificateNo: string;
  employeeName: string;
  certificateType: string;
  issuedDate: string;
  issuedBy: string;
}

export default function PublicVerificationPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await rolesApi.get<VerificationData>(`/public/verify/${identifier}`);
        setData(res.data);
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Certificate Not Found');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [identifier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center font-sans text-slate-200">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <span className="text-slate-400 text-sm mt-4">Verifying credentials...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-slate-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />

        <div className="text-center mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-slate-50">Certificate Verification</h2>
        </div>

        <div className="relative z-10">
          {error ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 mb-4 border border-rose-500/20">
                <XCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-50">Verification Failed</h3>
              <p className="text-slate-400 mt-2 text-sm">{error}</p>
              <div className="mt-6">
                <Link to="/" className="inline-block px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-sm transition-colors">
                  Go Home
                </Link>
              </div>
            </div>
          ) : data?.status === 'REVOKED' ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4 border border-amber-500/20">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-50">Certificate Revoked ❌</h3>
              <p className="text-slate-400 mt-2 text-sm">This certificate has been revoked by the issuing authority.</p>
            </div>
          ) : data ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-emerald-400 mb-6">Certificate Valid ✓</h3>
              
              <div className="text-start bg-slate-950/50 p-5 rounded-xl border border-slate-800 space-y-3.5 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Certificate No:</span>
                  <span className="font-bold text-slate-100">{data.certificateNo}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Employee Name:</span>
                  <span className="font-bold text-slate-100">{data.employeeName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Certificate Type:</span>
                  <span className="font-bold text-slate-100">{data.certificateType}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Issue Date:</span>
                  <span className="font-bold text-slate-100">{new Date(data.issuedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Issued By:</span>
                  <span className="font-bold text-slate-100">{data.issuedBy}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">Active</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="text-center mt-8 pt-4 border-t border-slate-800/60 text-slate-500 text-xs relative z-10">
          Powered by Enterprise SaaS
        </div>
      </div>
    </div>
  );
}




