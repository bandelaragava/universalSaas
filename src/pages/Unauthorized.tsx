import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  const [debugLog] = useState<unknown>(() => {
    try {
      const stored = localStorage.getItem('last_auth_debug_log');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to read auth debug log:', error);
      return null;
    }
  });
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-foreground">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-rose-950/20 to-transparent pointer-events-none" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 mb-6 shadow-lg shadow-rose-500/10 border border-rose-500/20 relative z-10">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>

        <h2 className="text-2xl font-bold text-foreground relative z-10">Access Denied</h2>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed relative z-10">
          You do not have the required permissions or active modules enabled to access this section of the portal.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center relative z-10">
          <button 
            onClick={() => navigate('/')} 
            className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 text-sm"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className="w-full sm:w-auto px-6 py-2.5 bg-muted hover:bg-accent text-muted-foreground border border-border rounded-xl transition-colors text-sm"
          >
            Go Back
          </button>
        </div>

        {debugLog !== null && import.meta.env.DEV && (
          <div className="mt-8 text-left bg-background border border-border rounded-xl p-4 relative z-10 text-xs">
            <p className="font-bold text-rose-400 mb-2 border-b border-border pb-1.5">[AUTH DEBUG LOG]</p>
            <pre className="overflow-x-auto text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(debugLog, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}


