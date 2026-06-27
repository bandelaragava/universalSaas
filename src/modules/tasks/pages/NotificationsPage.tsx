import React, { useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { Notification } from '../types';
import {
  Bell,
  Check,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  Clock,
  Eye,
  MailOpen
} from 'lucide-react';

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    navigateToDetails
  } = useTasks();

  // Local filter: 'all', 'unread', 'assigned', 'overdue', 'mention'
  const [filterType, setFilterType] = useState<string>('all');

  const handleNotificationClick = (n: Notification) => {
    markNotificationRead(n.id);
    navigateToDetails(n.taskId);
  };

  const filteredNotifications = useMemo(() => {
    return (Array.isArray(notifications) ? notifications : []).filter(n => {
      if (filterType === 'all') return true;
      if (filterType === 'unread') return !n.read;
      return n.type === filterType;
    });
  }, [notifications, filterType]);

  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter(n => !n.read).length;

  // Icon mapping based on notification type
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'assigned':
        return {
          icon: UserCheck,
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          label: 'Assignment'
        };
      case 'overdue':
        return {
          icon: AlertTriangle,
          color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          label: 'Overdue'
        };
      case 'mention':
        return {
          icon: MessageSquare,
          color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
          label: 'Mention'
        };
      case 'reminder':
      default:
        return {
          icon: Clock,
          color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          label: 'Reminder'
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-card animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            <p className="text-xs text-muted-foreground font-medium">
              You have {unreadCount} unread system alerts requiring verification
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-muted hover:bg-accent border border-border rounded-xl text-xs font-semibold text-foreground cursor-pointer shadow-soft transition-all"
          >
            <Check size={14} />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-1.5 border-b border-border">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'assigned', label: 'Assignments' },
          { id: 'overdue', label: 'Overdues' },
          { id: 'mention', label: 'Mentions' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="bg-card border border-border rounded-2xl shadow-soft divide-y divide-border overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-4">
              <MailOpen size={20} />
            </div>
            <h3 className="text-sm font-bold text-foreground">Inbox is Empty</h3>
            <p className="text-xs text-muted-foreground mt-1">No alerts found matching your selected category.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const { icon: TypeIcon, color, label } = getIcon(n.type);

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-accent/50 transition-all cursor-pointer relative group ${
                  !n.read ? 'bg-blue-500/5' : ''
                }`}
              >
                {/* Unread indicator bar */}
                {!n.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                )}

                {/* Type Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <TypeIcon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold">{n.timestamp}</span>
                  </div>

                  <p className="text-xs text-muted-foreground font-medium">
                    <span className="font-bold text-foreground">{n.sender}</span> {n.message}
                  </p>

                  <div className="text-[10px] text-muted-foreground font-semibold">
                    Related Task: <span className="underline group-hover:text-blue-600 transition-colors">{n.taskTitle}</span>
                  </div>
                </div>

                {/* Quick actions inside notification row */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationRead(n.id);
                      }}
                      title="Mark as read"
                      className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-emerald-600 cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToDetails(n.taskId);
                    }}
                    title="View Task Details"
                    className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


