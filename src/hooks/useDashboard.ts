import { useState, useEffect } from 'react';
import type { DashboardStatsResponse, ActivityLog } from '@/types/dashboard-api';
import rolesApi from '@/services/rolesApi';
import { 
  CalendarDays, 
  Clock, 
  IndianRupee, 
  TrendingUp, 
  ClipboardList, 
  AlertCircle, 
  Headphones 
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse>([]);
  const [activities, setActivities] = useState<ActivityLog>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [followupsRes, revenueRes, tasksRes, ticketsRes] = await Promise.allSettled([
          rolesApi.get('/leads/followups/'),
          rolesApi.get('/revenue/overview/'),
          rolesApi.get('/tasks/'),
          rolesApi.get('/support/tickets/all/'),
        ]);

        if (!isMounted) return;

        const todayDate = new Date();
        const isToday = (dateStr?: string) => {
          if (!dateStr) return false;
          try {
            const d = new Date(dateStr);
            return d.getFullYear() === todayDate.getFullYear() &&
                   d.getMonth() === todayDate.getMonth() &&
                   d.getDate() === todayDate.getDate();
          } catch {
            return false;
          }
        };

        // 1. Followups
        const followups = followupsRes.status === 'fulfilled' ? (followupsRes.value.data || []) : [];
        const todayFollowups = followups.filter((f: any) => !f.completed && isToday(f.scheduled_at || f.scheduledAt)).length;
        const pendingFollowups = followups.filter((f: any) => !f.completed).length;

        // 2. Revenue
        const revenueData = revenueRes.status === 'fulfilled' ? revenueRes.value.data : null;
        const confirmedRevenue = revenueData?.confirmed_revenue || 0;
        const pipelineRevenue = revenueData?.pipeline_revenue || 0;
        const confirmedLeads = revenueData?.confirmed_leads || [];

        // Today's revenue calculation: sum of confirmed leads paid today
        const todayRevenueVal = confirmedLeads
          .filter((l: any) => {
            const dateToCheck = l.updated_at || l.created_at || l.payment_date;
            return l.payment_status === 'Paid' && (isToday(dateToCheck) || !dateToCheck);
          })
          .reduce((sum: number, l: any) => sum + (l.amount || 0), 0);

        const todayRevenue = todayRevenueVal;
        const pendingRevenue = pipelineRevenue;

        // 3. Tasks
        const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []) : [];
        const todayTasks = tasks.filter((t: any) => t.status !== 'completed' && isToday(t.dueDate || t.due_date || t.created_at)).length;
        const pendingTasks = tasks.filter((t: any) => t.status !== 'completed').length;

        // 4. Tickets
        const tickets = ticketsRes.status === 'fulfilled' ? (ticketsRes.value.data || []) : [];
        const pendingTickets = tickets.filter((t: any) => t.status !== 'resolved' && t.status !== 'closed').length;

        const newStats: DashboardStatsResponse = [
          {
            id: 'today-followups',
            title: 'Today Follow-ups',
            value: todayFollowups,
            change: 0,
            trend: 'up',
            icon: CalendarDays,
            gradient: 'from-blue-500 to-cyan-500'
          },
          {
            id: 'pending-followups',
            title: 'Pending Follow-ups',
            value: pendingFollowups,
            change: 0,
            trend: 'up',
            icon: Clock,
            gradient: 'from-amber-500 to-orange-500'
          },
          {
            id: 'today-revenue',
            title: 'Today Revenue',
            value: `₹${todayRevenue.toLocaleString('en-IN')}`,
            change: 0,
            trend: 'up',
            icon: IndianRupee,
            gradient: 'from-emerald-500 to-teal-500'
          },
          {
            id: 'pending-revenue',
            title: 'Pending Revenue',
            value: `₹${pendingRevenue.toLocaleString('en-IN')}`,
            change: 0,
            trend: 'up',
            icon: TrendingUp,
            gradient: 'from-indigo-500 to-violet-500'
          },
          {
            id: 'today-tasks',
            title: 'Today Tasks',
            value: todayTasks,
            change: 0,
            trend: 'up',
            icon: ClipboardList,
            gradient: 'from-rose-500 to-pink-500'
          },
          {
            id: 'pending-tasks',
            title: 'Pending Tasks',
            value: pendingTasks,
            change: 0,
            trend: 'up',
            icon: AlertCircle,
            gradient: 'from-purple-500 to-fuchsia-500'
          },
          {
            id: 'pending-tickets',
            title: 'Pending Tickets',
            value: pendingTickets,
            change: 0,
            trend: 'up',
            icon: Headphones,
            gradient: 'from-sky-500 to-indigo-500'
          }
        ];

        setStats(newStats);
        setActivities([]);
      } catch (err) {
        if (isMounted) {
          error('Dashboard Error', 'Failed to fetch dashboard metrics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [error]);

  return { stats, activities, loading };
}


