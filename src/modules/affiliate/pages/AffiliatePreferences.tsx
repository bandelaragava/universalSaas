import React, { useState } from 'react';
import { Save, BellRing, ShieldCheck, MailWarning } from 'lucide-react';

export const AffiliatePreferences: React.FC = () => {
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    weeklyDigest: true,
    payoutAlerts: true,
    marketingUpdates: false,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Affiliate Preferences</h2>
        <p className="text-xs text-muted-foreground">
          Customize notifications, digest settings, and newsletter preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-border">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BellRing size={14} className="text-indigo-600" />
                Email Alerts
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">Receive emails when a new referral signs up using your promo code.</p>
            </div>
            <button 
              type="button"
              onClick={() => handleToggle('emailNotifications')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.emailNotifications ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <span 
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow-sm ring-0 transition duration-200 ease-in-out ${
                  prefs.emailNotifications ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-border">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-600" />
                Weekly Performance Digest
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">Get a weekly summary of click distribution and conversion rate statistics.</p>
            </div>
            <button 
              type="button"
              onClick={() => handleToggle('weeklyDigest')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.weeklyDigest ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <span 
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow-sm ring-0 transition duration-200 ease-in-out ${
                  prefs.weeklyDigest ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-border">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-600" />
                Payout Notifications
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">Get alerts when custom payout releases are approved, settled, or fail.</p>
            </div>
            <button 
              type="button"
              onClick={() => handleToggle('payoutAlerts')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.payoutAlerts ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <span 
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow-sm ring-0 transition duration-200 ease-in-out ${
                  prefs.payoutAlerts ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-border">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MailWarning size={14} className="text-indigo-600" />
                Marketing & Partner Updates
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">Receive updates regarding new affiliate assets, creative assets, and promotions.</p>
            </div>
            <button 
              type="button"
              onClick={() => handleToggle('marketingUpdates')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.marketingUpdates ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <span 
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow-sm ring-0 transition duration-200 ease-in-out ${
                  prefs.marketingUpdates ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            Preferences saved successfully!
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-border">
          <button 
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-500/10"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AffiliatePreferences;




