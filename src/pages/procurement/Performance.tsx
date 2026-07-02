import { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { motion } from 'framer-motion';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

interface KPIMetric {
  label: string;
  val: number;
  color: string;
}

interface ScorecardItem {
  subject: string;
  A: number;
  fullMark: number;
}

interface PerformanceData {
  topVendorName: string;
  scorecard: ScorecardItem[];
  kpis: KPIMetric[];
}

export default function Performance() {
  const [data, setData] = useState<PerformanceData>({
    topVendorName: 'Loading...',
    scorecard: [],
    kpis: []
  });

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await rolesApi.get('/vendor-performance');
        if (response.data && response.data.data) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch performance data', error);
      }
    };
    fetchPerformanceData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vendor Performance Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">Scorecards, KPI tracking, and comparative analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Top Vendor Scorecard ({data.topVendorName})</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.scorecard}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                <Radar name={data.topVendorName} dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">KPI Metrics (Fleet Average)</h3>
          <div className="space-y-6">
            {data.kpis.map((kpi, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{kpi.label}</span>
                  <span className="font-semibold text-foreground">{kpi.val}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`${kpi.color} h-2 rounded-full`} style={{ width: `${kpi.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
