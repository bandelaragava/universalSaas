import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Check } from 'lucide-react';
import { useAffiliate } from '../context/AffiliateContext';

export const AffiliateNotifications: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, loading } = useAffiliate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={16} />
          </div>
        );
      case 'warning':
        return (
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={16} />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Info size={16} />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Affiliate Alerts</h2>
          <p className="text-xs text-muted-foreground">
            Verify new signups, commissions cleared, and program changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllNotificationsRead}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border bg-card text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
          >
            <Check size={14} />
            Mark All Read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-900">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 flex items-start gap-3.5 transition hover:bg-slate-50/50 dark:hover:bg-slate-900/30 ${
                !notif.read ? 'bg-indigo-50/10 dark:bg-indigo-950/5' : ''
              }`}
            >
              {getIcon(notif.type)}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[9px] font-semibold text-muted-foreground">
                    {new Date(notif.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.read && (
                <button 
                  onClick={() => markNotificationRead(notif.id)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Bell size={24} className="text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold">All caught up!</p>
              <p className="text-[10px] text-slate-400">No new partner alerts or commission notifications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateNotifications;




