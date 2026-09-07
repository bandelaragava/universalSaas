import { motion } from 'framer-motion';
import rolesApi from '@/services/rolesApi';
import {
  Users,
  FileText,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { useState, useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  delay: number;
}

const StatCard = ({ title, value, change, isPositive, icon: Icon, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-card border border-border shadow-sm rounded-xl p-5 relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon size={64} className="text-cyan-500" />
    </div>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-foreground mt-1">{value}</h3>
      </div>
      <div className="p-2 bg-muted rounded-lg border border-border">
        <Icon size={20} className="text-cyan-600 dark:text-cyan-400" />
      </div>
    </div>
    <div className="flex items-center text-sm">
      <span className={`flex items-center ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} font-medium`}>
        {isPositive ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
        {change}
      </span>
      <span className="text-foreground0 ml-2">vs last month</span>
    </div>
  </motion.div>
);

interface AlertItem {
  vendor: string;
  issue: string;
  level: string;
}

interface ActivityItem {
  title: string;
  desc: string;
  time: string;
}

interface DashboardData {
  stats: {
    activeVendors: number;
    activeContracts: number;
    procurementSpend: string;
    pendingApprovals: number;
  };
  spendData: Array<{ name: string; spend: number }>;
  vendorData: Array<{ name: string; count: number }>;
  alerts: AlertItem[];
  activities: ActivityItem[];
}

export default function VendorAnalyticsDashboard() {
  const { searchQuery } = useAppStore();

  const [data, setData] = useState<DashboardData>({
    stats: { activeVendors: 0, activeContracts: 0, procurementSpend: '₹0', pendingApprovals: 0 },
    spendData: [],
    vendorData: [],
    alerts: [],
    activities: []
  });
  const [spendFilter, setSpendFilter] = useState('Last 6 months');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await rolesApi.get(`/vendor-dashboard?filter=${encodeURIComponent(spendFilter)}`);
        if (response.data && response.data.data) {
          setData(response.data.data);
        } else if (response.data && !response.data.data && Object.keys(response.data).length > 0) {
          // fallback if directly returned
          if (response.data.stats) setData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [spendFilter]);

  const filteredAlerts = data.alerts.filter(alert =>
    alert.vendor.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
    alert.issue.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  );

  const filteredActivities = data.activities.filter(act =>
    act.title.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
    act.desc.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  );

  if (isLoading && !data.spendData.length) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Active Vendors" value={data.stats.activeVendors} change="--%" isPositive={true} icon={Users} delay={0.1} />
        <StatCard title="Active Contracts" value={data.stats.activeContracts} change="--%" isPositive={true} icon={FileText} delay={0.2} />
        <StatCard title="Procurement Spend" value={data.stats.procurementSpend} change="--%" isPositive={false} icon={CreditCard} delay={0.3} />
        <StatCard title="Pending Approvals" value={data.stats.pendingApprovals} change="--" isPositive={false} icon={Clock} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6 lg:col-span-2 min-w-0"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-foreground">Procurement Spend Analytics</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                className="bg-background border border-border text-foreground font-medium text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block px-3 py-1.5 flex-1 sm:flex-none"
                value={['Last 6 months', 'This Year', 'Last Year'].includes(spendFilter) ? spendFilter : 'Custom'}
                onChange={(e) => {
                  if (e.target.value === 'Custom') setSpendFilter(new Date().getFullYear().toString());
                  else setSpendFilter(e.target.value);
                }}
              >
                <option value="Last 6 months">Last 6 months</option>
                <option value="This Year">This Year</option>
                <option value="Last Year">Last Year</option>
                <option value="Custom">Custom Year...</option>
              </select>
              {!['Last 6 months', 'This Year', 'Last Year'].includes(spendFilter) && (
                <input
                  type="number"
                  min="1780"
                  max={new Date().getFullYear()}
                  placeholder="YYYY"
                  className="bg-background border border-border text-foreground font-medium text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block px-3 py-1.5 w-24"
                  value={spendFilter}
                  onChange={(e) => setSpendFilter(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className="w-full min-w-0 h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={data.spendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="spend" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Secondary Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6 min-w-0"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Vendors by Category</h3>
          <div className="w-full min-w-0 h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={data.vendorData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
                <Tooltip
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Action / Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 mr-2" size={20} />
              Risk & Compliance Alerts
            </h3>
            <button className="text-cyan-600 dark:text-cyan-400 text-sm hover:text-cyan-300">View All</button>
          </div>
          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, i) => (
                <div key={i} className="flex items-start p-3 bg-muted/20 rounded-lg border border-slate-800">
                  <div className={`w-2 h-2 mt-2 rounded-full mr-3 shrink-0 ${alert.level === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                      alert.level === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-cyan-500'
                    }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{alert.vendor}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.issue}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No alerts found matching "{searchQuery}"
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400 mr-2" size={20} />
              Recent Activities
            </h3>
          </div>
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((act, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div className="relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full after:absolute after:left-[2.5px] after:top-4 after:w-0.5 after:h-full after:bg-muted last:after:hidden">
                    <p className="text-sm font-medium text-foreground">{act.title}</p>
                    <p className="text-xs text-muted-foreground">{act.desc}</p>
                  </div>
                  <span className="text-xs text-foreground0 whitespace-nowrap">{act.time}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No activities found matching "{searchQuery}"
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}






