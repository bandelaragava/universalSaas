import React, { useState } from 'react';
import { 
  DollarSign, Percent, TrendingUp, RefreshCw, Layers,
  Wallet, MousePointer, Megaphone, Users
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { useAffiliate } from '../context/AffiliateContext';

const StatsCard: React.FC<{
  title: string;
  value: string | number;
  trend: string;
  trendType: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
}> = ({ title, value, trend, trendType, icon: Icon, iconBg }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
          {title}
        </span>
        <div className={`flex items-center justify-center p-2 rounded-xl ${iconBg}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black text-foreground">
          {value}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
          trendType === 'up' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
            : trendType === 'down' 
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
              : 'bg-slate-500/10 text-muted-foreground'
        }`}>
          {trend}
        </span>
        <span className="text-[9px] font-bold text-muted-foreground">vs last month</span>
      </div>
    </div>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedVal = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(payload[0]?.value || 0);

    return (
      <div className="bg-card p-3 rounded-xl border border-border shadow-xl text-xs font-bold space-y-1 text-left">
        <p className="text-muted-foreground">{label}</p>
        <p className="text-indigo-600 dark:text-indigo-400">Commission: {formattedVal}</p>
        <p className="text-emerald-600 dark:text-emerald-400">Clicks: {payload[1]?.value || 0}</p>
      </div>
    );
  }
  return null;
};

export const AffiliateDashboard: React.FC = () => {
  const { profile, referrals, trends, stats, loading, refreshData } = useAffiliate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading || !profile || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Partner Workspace Overview</h2>
          <p className="text-xs text-muted-foreground">
            Track metrics, active campaigns, and payout releases in real time.
          </p>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-border bg-card text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Earnings"
          value={formatCurrency(stats.total)}
          trend="+15.3%"
          trendType="up"
          icon={DollarSign}
          iconBg="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        />
        <StatsCard
          title="Pending Earnings"
          value={formatCurrency(stats.pending)}
          trend="+4.8%"
          trendType="up"
          icon={Layers}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Paid Earnings"
          value={formatCurrency(stats.paid)}
          trend="+12.0%"
          trendType="up"
          icon={Wallet}
          iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          title="Monthly Performance"
          value={formatCurrency(stats.thisMonth)}
          trend="+24.1%"
          trendType="up"
          icon={TrendingUp}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate || 0}%`}
          trend="-0.5%"
          trendType="down"
          icon={Percent}
          iconBg="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
        <StatsCard
          title="Total Clicks"
          value={(stats.totalClicks || 0).toLocaleString()}
          trend="+8.2%"
          trendType="up"
          icon={MousePointer}
          iconBg="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <StatsCard
          title="Total Referrals"
          value={stats.totalReferrals || 0}
          trend="+5.0%"
          trendType="up"
          icon={Users}
          iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          title="Active Campaigns"
          value={stats.activeCampaigns || 0}
          trend="0"
          trendType="neutral"
          icon={Megaphone}
          iconBg="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
        />
      </div>

      {/* Analytics Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Performance Chart */}
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground">Performance Revenue Trends</h3>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Clicks vs Commissions earned</p>
            </div>
            <select className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none">
              <option>Last 6 Months</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="commission" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#commGrad)" />
                <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#clickGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Channel breakdown */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground">Channel Click Sources</h3>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Top-performing referrers</p>
            </div>
          </div>

          <div className="h-72 w-full flex flex-col justify-between">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Twitter/X', value: 450 },
                { name: 'YouTube', value: 380 },
                { name: 'Blog', value: 310 },
                { name: 'LinkedIn', value: 240 }
              ]} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} style={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-2 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Twitter Campaign</span>
                <span className="text-slate-900 dark:text-white font-extrabold">45.0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>YouTube Promos</span>
                <span className="text-slate-900 dark:text-white font-extrabold">38.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Referrals list card */}
      <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-bold text-sm text-foreground">Recent Referral Subscriptions</h3>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Top latest accounts registered via your promo links</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <th className="pb-3.5 pl-2">Affiliate Brand</th>
                <th className="pb-3.5">Registration Date</th>
                <th className="pb-3.5">Assigned tier</th>
                <th className="pb-3.5 text-right pr-2">Your Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {referrals.slice(0, 3).map((ref) => (
                <tr key={ref.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 pl-2">
                    <div className="flex items-center gap-3">
                      <img src={ref.avatar} className="w-9 h-9 rounded-full object-cover border border-border shadow-sm" alt={ref.name} />
                      <div>
                        <p className="font-bold text-slate-950 dark:text-slate-50">{ref.name}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{ref.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-medium text-muted-foreground">
                    {new Date(ref.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      {ref.tier}
                    </span>
                  </td>
                  <td className="py-4 text-right font-black text-emerald-600 dark:text-emerald-400 pr-2">
                    {formatCurrency(ref.commission)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;




