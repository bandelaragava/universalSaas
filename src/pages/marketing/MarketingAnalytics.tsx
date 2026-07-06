import React, { useState, useEffect } from 'react';
import { getFunnelStats, getConversionRate, getCampaignStats } from '@/services/marketing';
import { Shield, Filter, BarChart2, TrendingUp, Users, MousePointer, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function MarketingAnalytics() {
  const [campaignStats, setCampaignStats] = useState<Record<string, number>>({});
  const [funnelStats, setFunnelStats] = useState<Record<string, number>>({});
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moduleType, setModuleType] = useState('ALL');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [campaigns, funnel, rate] = await Promise.all([
        getCampaignStats(),
        getFunnelStats(),
        getConversionRate()
      ]);
      setCampaignStats(campaigns || {});
      setFunnelStats(funnel || {});
      setConversionRate(rate || 0);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [moduleType]);

  const totalClicks = (funnelStats.CLICK || 0) + (funnelStats.PAGE_VIEW || 0);
  const totalLeads = funnelStats.SIGNUP || 0;
  const totalCampaigns = Object.values(campaignStats).reduce((a, b) => a + b, 0);

  const chartData = Object.entries(campaignStats).map(([name, value]) => ({
    name,
    count: value
  }));

  const funnelData = [
    { name: 'Site Visits', val: funnelStats.PAGE_VIEW || 0, color: 'bg-cyan-500' },
    { name: 'Clicks', val: funnelStats.CLICK || 0, color: 'bg-indigo-500' },
    { name: 'Signups', val: funnelStats.SIGNUP || 0, color: 'bg-purple-500' },
    { name: 'Purchased', val: funnelStats.PURCHASE || 0, color: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="flex items-center text-lg font-bold text-foreground gap-2">
          <Shield className="text-cyan-500" size={20} />
          Marketing Campaign Analytics
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground" size={16} />
          <select
            className="input-field text-xs bg-background border-border text-foreground px-3 py-1 rounded-md"
            value={moduleType}
            onChange={(e) => setModuleType(e.target.value)}
          >
            <option value="ALL">All Modules</option>
            <option value="CRM">CRM</option>
            <option value="HRMS">HRMS</option>
            <option value="LMS">LMS</option>
            <option value="VENDOR">Vendor</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Campaigns</p>
                  <p className="mt-1 text-2xl font-bold">{totalCampaigns}</p>
                </div>
                <div className="p-3 bg-cyan-500/10 rounded-xl"><BarChart2 className="text-cyan-500" size={20} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Leads</p>
                  <p className="mt-1 text-2xl font-bold">{totalLeads}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl"><Users className="text-purple-500" size={20} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Clicks</p>
                  <p className="mt-1 text-2xl font-bold">{totalClicks}</p>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-xl"><MousePointer className="text-indigo-500" size={20} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Conversion Rate</p>
                  <p className="mt-1 text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl"><Percent className="text-emerald-500" size={20} /></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="text-cyan-500" size={16} />
                  Performance Trend ({moduleType === 'ALL' ? 'Global' : moduleType})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-[10px] text-muted-foreground" />
                      <YAxis className="text-[10px] text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      />
                      <Bar dataKey="count" fill="var(--color-cyan-550, #06b6d4)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">
                    No campaign performance data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Funnel Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {funnelData.map((item, idx, arr) => {
                  const max = arr[0].val || 1;
                  const pct = (item.val / max) * 100;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-foreground">{item.val}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-lg h-5 overflow-hidden relative border border-slate-700/30">
                        <div
                          className={`h-full ${item.color} flex items-center justify-end px-2 text-[9px] font-bold text-white transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        >
                          {pct > 15 && `${pct.toFixed(0)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}


