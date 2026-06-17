import { useState, useEffect } from 'react';
import type { DashboardStatsResponse, ActivityLog } from '@/types/dashboard-api';
import { reportsService } from '@/services/reports';
import { revenueService } from '@/services/revenue';
import { payrollService } from '@/services/payroll';
import { Users, Banknote, Briefcase } from 'lucide-react';
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
        const [reportsRes, revenueRes, payrollRes] = await Promise.allSettled([
          reportsService.getReportsDashboard(),
          revenueService.getRevenueOverview(),
          payrollService.getDashboardStats()
        ]);

        if (!isMounted) return;

        const newStats: DashboardStatsResponse = [];

        if (reportsRes.status === 'fulfilled' && reportsRes.value.data?.totals) {
          const employees = reportsRes.value.data.totals.employees || 0;
          newStats.push({
            id: 'users',
            title: 'Total Users',
            value: employees,
            change: 0,
            trend: 'up',
            icon: Users,
            gradient: 'from-blue-500 to-cyan-500'
          });
        }

        if (revenueRes.status === 'fulfilled' && revenueRes.value.data) {
          newStats.push({
            id: 'revenue',
            title: 'Confirmed Revenue',
            value: `₹${revenueRes.value.data.confirmed_revenue?.toLocaleString() || 0}`,
            change: 0,
            trend: 'up',
            icon: Banknote,
            gradient: 'from-emerald-500 to-teal-500'
          });
        }

        if (payrollRes.status === 'fulfilled' && payrollRes.value.data) {
          newStats.push({
            id: 'payroll',
            title: 'Total Payroll',
            value: `₹${payrollRes.value.data.total_payroll?.toLocaleString() || 0}`,
            change: 0,
            trend: 'down',
            icon: Briefcase,
            gradient: 'from-purple-500 to-indigo-500'
          });
        }

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


