import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, Clock, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import rolesApi from '@/services/rolesApi';

interface Notification {
  id: string | number;
  title: string;
  message?: string;
  content?: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  read?: boolean;
  isRead?: boolean;
  timestamp?: string;
  created_at?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await rolesApi.get('/notifications/');
      setNotifications(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error('Failed to load notifications:', err);
      error('Error', 'Could not load notifications from server.');
    } finally {
      setLoading(false);
    }
  };

  const isUnread = (n: Notification) => n.read === false || n.isRead === false;

  const unreadCount = notifications.filter(isUnread).length;

  const markAllAsRead = async () => {
    try {
      // Optioanlly, we might need a backend call here: await rolesApi.post('/notifications/mark_all_read/')
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      success('All Caught Up', 'All notifications have been marked as read.');
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string | number) => {
    try {
      // await rolesApi.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type?: string) => {
    const t = type?.toLowerCase() || 'info';
    switch (t) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'alert':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Just now';
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Notifications
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold ml-2">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with recent alerts, messages, and system events.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg border border-primary/10"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
             <Loader2 className="w-10 h-10 animate-spin text-primary/40 mb-4" />
             <p>Loading notifications...</p>
           </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>You have no notifications at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const read = !isUnread(notification);
              return (
                <div
                  key={notification.id}
                  className={`p-5 flex gap-4 transition-colors ${read ? 'bg-background hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className={`text-sm font-semibold ${read ? 'text-foreground/80' : 'text-foreground'}`}>
                        {notification.title || 'Notification'}
                      </h4>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {formatDate(notification.timestamp || notification.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm ${read ? 'text-muted-foreground' : 'text-foreground/90'}`}>
                      {notification.message || notification.content}
                    </p>
                    
                    {!read && (
                      <div className="pt-2">
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
