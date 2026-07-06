import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface EntityFormPageProps {
  title: string;
  subtitle?: string;
  backRoute?: string;
  onBack?: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  children: React.ReactNode;
  isModal?: boolean;
}

export default function EntityFormPage({
  title,
  subtitle,
  backRoute,
  onBack,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
  error,
  success,
  children,
  isModal = false,
}: EntityFormPageProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backRoute) {
      navigate(backRoute);
    }
  };

  return (
    <div className={isModal ? "w-full" : "max-w-[900px] mx-auto"}>
      {/* ── Page Header ── */}
      {!isModal && (
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
              <button
                type="button"
                className="hover:underline flex items-center gap-1 text-xs text-muted-foreground"
                onClick={handleBack}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                </svg>
                Back
              </button>
              {subtitle && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="truncate max-w-[200px]">{subtitle}</span>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          </div>
        </div>
      )}

      {/* ── Floating Alerts ── */}
      {(success || error) && (
        <div
          className={`fixed top-4 right-4 m-3 border p-3 rounded-lg shadow-lg text-sm flex items-center gap-2 z-50 max-w-[400px] animate-in fade-in slide-in-from-top-4 duration-300 ${
            success
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
          role="alert"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
            {success ? (
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
            ) : (
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
            )}
          </svg>
          <span>{success || error}</span>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-5">
          {children}
        </div>

        {/* ── Sticky Footer ── */}
        <div className={`border-t border-border mt-6 flex justify-end gap-2 py-4 ${isModal ? 'bg-card' : 'bg-background sticky bottom-0 z-10'}`}>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-card hover:bg-accent hover:text-accent-foreground h-10 px-4 active:scale-95 transition-all cursor-pointer"
            onClick={isModal ? onBack : handleBack}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 h-10 px-4 active:scale-95 transition-all cursor-pointer"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}




