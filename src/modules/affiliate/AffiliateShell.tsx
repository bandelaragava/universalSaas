import React, { useState } from 'react';
import { AffiliateProvider, useAffiliate } from './context/AffiliateContext';
import AffiliateDashboard from './pages/AffiliateDashboard';
import Referrals from './pages/Referrals';
import ReferralLinks from './pages/ReferralLinks';
import Earnings from './pages/Earnings';
import Payments from './pages/Payments';
import AffiliateProfile from './pages/AffiliateProfile';
import AffiliateNotifications from './pages/AffiliateNotifications';
import AffiliatePreferences from './pages/AffiliatePreferences';
import { Bell, User, LayoutDashboard, Link2, Users, DollarSign, Wallet, Settings } from 'lucide-react';

function AffiliateShellContent() {
  const { profile, notifications, loading } = useAffiliate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'referrals' | 'links' | 'earnings' | 'payments' | 'profile' | 'notifications' | 'preferences'>('dashboard');

  const unreadAlerts = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'links', label: 'Promo Links', icon: Link2 },
    { id: 'earnings', label: 'Earnings Ledger', icon: DollarSign },
    { id: 'payments', label: 'Payout History', icon: Wallet },
    { id: 'profile', label: 'Account Profile', icon: User },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadAlerts },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ] as const;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard': return <AffiliateDashboard />;
      case 'referrals': return <Referrals />;
      case 'links': return <ReferralLinks />;
      case 'earnings': return <Earnings />;
      case 'payments': return <Payments />;
      case 'profile': return <AffiliateProfile />;
      case 'notifications': return <AffiliateNotifications />;
      case 'preferences': return <AffiliatePreferences />;
      default: return <AffiliateDashboard />;
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-50 dark:bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-550">Initializing Partner Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="flex min-h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        
        {/* Affiliate top bar layout */}
        <header className="flex-shrink-0 z-30 border-b border-border/80 bg-card/80 px-4 py-4 backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-black text-sm">
                   A
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-foreground tracking-tight leading-tight">
                    Affiliate Partner Portal
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider leading-none mt-0.5">
                    {profile.tier || 'Verified Partner'} Workspace
                  </p>
                </div>
              </div>

              {/* User quick profile preview */}
              <div className="flex items-center gap-2">
                <img 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="w-8 h-8 rounded-full object-cover border border-border shadow-sm" 
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-[11px] font-bold text-foreground leading-tight">{profile.name}</span>
                  <span className="text-[9px] font-semibold text-muted-foreground leading-none">Code: {profile.referralCode}</span>
                </div>
              </div>
            </div>

            {/* Sub-tab navigation */}
            <nav className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                    {'badge' in tab && tab.badge !== undefined && tab.badge > 0 && (
                      <span className="ml-1 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-extrabold text-white">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Content area */}
        <main className="bg-background p-4 sm:p-6 md:p-8 flex-1">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}

export default function AffiliateShell() {
  return (
    <AffiliateProvider>
      <AffiliateShellContent />
    </AffiliateProvider>
  );
}
