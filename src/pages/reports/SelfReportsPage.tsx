/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { reportsService } from '@/services/reports';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '@/auth/usePermissions';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ROLE_COLORS: Record<string, string> = {
  superadmin: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  admin: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  manager: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  hr: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  employee: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
};

const LEAVE_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  approved: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  rejected: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-450' },
  pending: { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-450' },
  cancelled: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' },
};

const fmt = (v: number | string | undefined | null) =>
  `₹${parseFloat(String(v || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

interface SelfReportsPageProps {
  forcedScope?: 'self' | 'all';
}

export default function SelfReportsPage({ forcedScope = 'self' }: SelfReportsPageProps) {
  const [tab, setTab] = useState<'dashboard' | 'attendance' | 'leave' | 'payroll' | 'headcount'>('dashboard');
  const [scope, setScope] = useState<'self' | 'all'>(forcedScope);
  const activeScope = forcedScope || scope;

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any>(null);

  // Filters
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState('');
  const [payrollView, setPayrollView] = useState<'register' | 'lop' | 'ot'>('register');
  const { can } = usePermissions();
  const loadTab = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'dashboard') {
        res = await reportsService.getReportsDashboard({ scope: activeScope });
      } else if (tab === 'attendance') {
        res = await reportsService.getAttendanceReport({ month, year, status: status || undefined, scope: activeScope });
      } else if (tab === 'leave') {
        res = await reportsService.getLeaveReport({ year, month: month || undefined, status: status || undefined, scope: activeScope });
      } else if (tab === 'payroll') {
        const fn = payrollView === 'lop' ? reportsService.getLopReport : payrollView === 'ot' ? reportsService.getOvertimeReport : reportsService.getPayrollReport;
        res = await fn({ month, year, scope: activeScope });
      } else if (tab === 'headcount') {
        res = await reportsService.getHeadcountReport();
      }
      if (res?.data) {
        setData(res.data);
      }
    } catch {
      toast.error('Failed to load report data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!can('REPORTS_SELF_REPORTS')) return;
    loadTab();
  }, [tab, month, year, status, payrollView, activeScope, can]);

  const handleDownloadCsv = () => {
    let type = '';
    let params: any = { scope: activeScope };

    if (tab === 'attendance') {
      type = 'attendance';
      params = { ...params, month, year, status: status || undefined };
    } else if (tab === 'leave') {
      type = 'leave';
      params = { ...params, year, month: month || undefined, status: status || undefined };
    } else if (tab === 'payroll') {
      type = payrollView === 'register' ? 'payroll' : payrollView === 'lop' ? 'lop' : 'overtime';
      params = { ...params, month, year };
    } else if (tab === 'headcount') {
      type = 'headcount';
    }

    if (type) {
      reportsService.downloadReportCsv(type, params);
    }
  };

  const renderDashboard = () => {
    if (!data) return null;
    const { attendance, leave, payroll, headcount } = data;

    const sections = [
      {
        title: `Attendance - ${MONTH_NAMES[data.month]} ${data.year}`,
        color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
        items: [
          { label: 'Total Records', value: attendance?.total_records },
          { label: 'Present', value: attendance?.present },
          { label: 'Absent', value: attendance?.absent },
          { label: 'Late', value: attendance?.late },
          { label: 'On Leave', value: attendance?.on_leave },
        ],
      },
      {
        title: `Leave - ${MONTH_NAMES[data.month]} ${data.year}`,
        color: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
        items: [
          { label: 'Total Requests', value: leave?.total_requests },
          { label: 'Approved', value: leave?.approved },
          { label: 'Pending', value: leave?.pending },
          { label: 'Rejected', value: leave?.rejected },
        ],
      },
      {
        title: payroll?.last_month ? `Payroll - ${MONTH_NAMES[payroll.last_month]} ${payroll.last_year}` : 'Payroll',
        color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
        items: [
          { label: 'Total Gross', value: fmt(payroll?.total_gross) },
          { label: 'Total Net', value: fmt(payroll?.total_net) },
          { label: 'Employees', value: payroll?.employees },
          { label: 'Status', value: payroll?.status || 'N/A' },
        ],
      },
      {
        title: 'Headcount Summary',
        color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
        show: activeScope !== 'self',
        items: [
          { label: 'Total Active', value: headcount?.total_active },
          ...Object.entries(headcount?.by_role || {}).map(([role, count]) => ({
            label: role.charAt(0).toUpperCase() + role.slice(1),
            value: count as number,
          })),
        ],
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((sec, i) => {
          if (sec.show === false) return null;
          return (
            <Card key={i} className="border-border">
              <CardHeader className={`p-4 border-b border-border/80 ${sec.color} rounded-t-xl`}>
                <CardTitle className="text-xs font-bold uppercase tracking-wider">{sec.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {sec.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-border last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value ?? 0}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderAttendance = () => {
    if (!data) return null;
    const rows = (data.data || []).filter((r: any) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [r.emp_code, r.name, r.dept, r.role, r.emp_type].some((v) => String(v || '').toLowerCase().includes(q));
    });

    return (
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground">
          {MONTH_NAMES[month]} {year} &middot; {data.working_days} working days &middot; {rows.length} records &middot; {activeScope === 'self' ? 'My attendance logs' : 'All logs'}
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Dept</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-emerald-400">Present</th>
                  <th className="p-3 text-rose-400">Absent</th>
                  <th className="p-3 text-yellow-500">Late</th>
                  <th className="p-3">Half</th>
                  <th className="p-3 text-indigo-400">Leave</th>
                  <th className="p-3">Holiday</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3 text-purple-400">OT Hrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-muted-foreground italic">No logs matched this filter criteria.</td>
                  </tr>
                ) : (
                  rows.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3"><code className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">{r.emp_code}</code></td>
                      <td className="p-3 font-semibold text-foreground">{r.name}</td>
                      <td className="p-3 text-muted-foreground">{r.dept}</td>
                      <td className="p-3 capitalize text-muted-foreground">{r.role}</td>
                      <td className="p-3 capitalize text-muted-foreground">{r.emp_type}</td>
                      <td className="p-3 text-emerald-400 font-bold">{r.present}</td>
                      <td className={`p-3 font-bold ${r.absent > 0 ? 'text-rose-450' : 'text-muted-foreground'}`}>{r.absent}</td>
                      <td className={`p-3 ${r.late > 0 ? 'text-yellow-500 font-bold' : 'text-muted-foreground'}`}>{r.late}</td>
                      <td className={`p-3 ${r.half_day > 0 ? 'text-amber-500 font-semibold' : 'text-muted-foreground'}`}>{r.half_day}</td>
                      <td className="p-3 text-indigo-400">{r.leave}</td>
                      <td className="p-3 text-muted-foreground">{r.holiday}</td>
                      <td className="p-3 text-muted-foreground font-semibold">{r.total_hours?.toFixed(1)}h</td>
                      <td className={`p-3 ${r.ot_hours > 0 ? 'text-purple-400 font-bold' : 'text-muted-foreground'}`}>
                        {r.ot_hours > 0 ? `${r.ot_hours.toFixed(1)}h` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLeave = () => {
    if (!data) return null;
    const rows = (data.data || []).filter((r: any) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [r.emp_code, r.name, r.department, r.leave_type, r.status].some((v) => String(v || '').toLowerCase().includes(q));
    });

    return (
      <div className="space-y-4">
        {data.summary?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {data.summary.map((s: any) => (
              <div key={s.name} className="bg-card border border-border rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.name}</p>
                <p className="text-xl font-extrabold text-primary">{s.total_days}</p>
                <p className="text-[10px] text-muted-foreground">{s.count} requests</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Dept</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Paid/Unpaid</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground italic">No leave records matched this filter criteria.</td>
                  </tr>
                ) : (
                  rows.map((r: any, idx: number) => {
                    const st = LEAVE_STATUS_STYLE[r.status] || LEAVE_STATUS_STYLE.pending;
                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3"><code className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">{r.emp_code}</code></td>
                        <td className="p-3 font-semibold text-foreground">{r.name}</td>
                        <td className="p-3 text-muted-foreground">{r.department}</td>
                        <td className="p-3 text-muted-foreground">{r.leave_type}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${r.is_paid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-450'}`}>
                            {r.is_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{r.start_date}</td>
                        <td className="p-3 text-muted-foreground">{r.end_date}</td>
                        <td className="p-3 text-foreground font-bold">{r.days}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${st.bg} ${st.text} uppercase`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{r.approved_by || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPayroll = () => {
    if (!data) return null;
    const rows = (data.data || []).filter((r: any) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [r.emp_code, r.name, r.department, r.dept, r.emp_type].some((v) => String(v || '').toLowerCase().includes(q));
    });

    return (
      <div className="space-y-4">
        {data.totals && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: 'Employees', value: data.totals.employees, color: 'border-slate-500/20 text-slate-400 bg-slate-500/5' },
              { label: 'Total Gross', value: fmt(data.totals.gross), color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
              { label: 'Total Net', value: fmt(data.totals.net_pay), color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
              { label: 'Total PF', value: fmt(data.totals.pf), color: 'border-purple-500/20 text-purple-400 bg-purple-500/5' },
              { label: 'Total TDS', value: fmt(data.totals.tds), color: 'border-rose-500/20 text-rose-400 bg-rose-500/5' },
              { label: 'Total LOP', value: fmt(data.totals.lop_deduction), color: 'border-amber-500/20 text-amber-400 bg-amber-500/5' },
            ].map((s, idx) => (
              <div key={idx} className={`border rounded-xl p-3.5 space-y-1 ${s.color}`}>
                <p className="text-[10px] uppercase tracking-wider">{s.label}</p>
                <p className="text-base font-extrabold">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {payrollView === 'register' && (
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Dept</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">LOP</th>
                    <th className="p-3">OT Hrs</th>
                    <th className="p-3">Gross</th>
                    <th className="p-3 text-purple-400">PF</th>
                    <th className="p-3 text-rose-450">TDS</th>
                    <th className="p-3 text-yellow-500">LOP Ded</th>
                    <th className="p-3 text-emerald-400">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-muted-foreground italic">No register entries matching criteria.</td>
                    </tr>
                  ) : (
                    rows.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3"><code className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">{r.emp_code}</code></td>
                        <td className="p-3 font-semibold text-foreground">{r.name}</td>
                        <td className="p-3 text-muted-foreground">{r.department}</td>
                        <td className="p-3 text-muted-foreground">{r.present_days}/{r.working_days}</td>
                        <td className={`p-3 font-bold ${r.lop_days > 0 ? 'text-rose-455' : 'text-muted-foreground'}`}>
                          {r.lop_days > 0 ? `${r.lop_days}d` : '-'}
                        </td>
                        <td className="p-3 text-purple-400">{r.ot_hours > 0 ? `${r.ot_hours}h` : '-'}</td>
                        <td className="p-3 text-muted-foreground font-semibold">{fmt(r.gross)}</td>
                        <td className="p-3 text-purple-400">{fmt(r.pf_employee)}</td>
                        <td className="p-3 text-rose-455">{r.tds > 0 ? fmt(r.tds) : '-'}</td>
                        <td className="p-3 text-yellow-500">{r.lop_deduction > 0 ? fmt(r.lop_deduction) : '-'}</td>
                        <td className="p-3 text-emerald-400 font-extrabold text-sm">{fmt(r.net_pay)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {payrollView === 'lop' && (
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-yellow-500/5 border-b border-border text-yellow-500 uppercase text-[10px] tracking-wider">
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Dept</th>
                    <th className="p-3">LOP Days</th>
                    <th className="p-3">LOP Deduction</th>
                    <th className="p-3">Working Days</th>
                    <th className="p-3">Present Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3"><code className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">{r.emp_code}</code></td>
                      <td className="p-3 font-semibold text-foreground">{r.name}</td>
                      <td className="p-3 text-muted-foreground">{r.department}</td>
                      <td className="p-3 text-rose-450 font-bold">{r.lop_days}d</td>
                      <td className="p-3 text-yellow-500 font-bold">{fmt(r.lop_deduction)}</td>
                      <td className="p-3 text-muted-foreground">{r.working_days}</td>
                      <td className="p-3 text-muted-foreground">{r.present_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {payrollView === 'ot' && (
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-purple-500/5 border-b border-border text-purple-400 uppercase text-[10px] tracking-wider">
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Dept</th>
                    <th className="p-3">OT Hours</th>
                    <th className="p-3">OT Pay</th>
                    <th className="p-3">Gross</th>
                    <th className="p-3">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3"><code className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">{r.emp_code}</code></td>
                      <td className="p-3 font-semibold text-foreground">{r.name}</td>
                      <td className="p-3 text-muted-foreground">{r.dept || r.department}</td>
                      <td className="p-3 text-purple-450 font-bold">{r.ot_hours}h</td>
                      <td className="p-3 text-indigo-400 font-bold">{fmt(r.ot_pay)}</td>
                      <td className="p-3 text-muted-foreground font-semibold">{fmt(r.gross)}</td>
                      <td className="p-3 text-emerald-400 font-bold">{fmt(r.net_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHeadcount = () => {
    if (!data) return null;
    const filtered = (data.employees || []).filter((e: any) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.emp_code.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q);
    });

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-border rounded-xl p-4 space-y-1">
            <p className="text-[28px] font-black text-white leading-none">{data.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Active</p>
          </div>
          {Object.entries(data.by_role || {}).map(([role, count]) => {
            const style = ROLE_COLORS[role] || ROLE_COLORS.employee;
            return (
              <div key={role} className={`border rounded-xl p-4 space-y-1 ${style}`}>
                <p className="text-xl font-bold leading-none">{count as number}</p>
                <p className="text-[10px] uppercase tracking-wider capitalize">{role}</p>
              </div>
            );
          })}
        </div>

        {Object.keys(data.by_department || {}).length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">By Department</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.by_department).map(([dept, count]) => (
                <div key={dept} className="bg-muted border border-border rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
                  <span className="font-extrabold text-primary">{count as number}</span>
                  <span className="text-muted-foreground">{dept}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground italic">No employees matched this filter.</td>
                  </tr>
                ) : (
                  filtered.map((r: any, idx: number) => {
                    const style = ROLE_COLORS[r.role] || ROLE_COLORS.employee;
                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3"><code className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">{r.emp_code}</code></td>
                        <td className="p-3 font-semibold text-foreground">{r.name}</td>
                        <td className="p-3 text-muted-foreground text-[11px]">{r.email}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${style}`}>
                            {r.role}
                          </span>
                        </td>
                        <td className="p-3 capitalize text-muted-foreground">{r.emp_type}</td>
                        <td className="p-3 text-muted-foreground">{r.dept}</td>
                        <td className="p-3 capitalize text-muted-foreground">{r.desig?.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-muted-foreground">{r.joined}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leave', label: 'Leave' },
    { key: 'payroll', label: 'Payroll' },
    ...(activeScope !== 'self' ? [{ key: 'headcount', label: 'Headcount' }] : []),
  ];

  if (!can('REPORTS_SELF_REPORTS')) {
    return (
      <div className="p-8 text-center text-rose-500 font-semibold bg-card border border-border rounded-xl">
        Unauthorized: You do not have permission to view Self Reports.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={activeScope === 'self' ? 'My Self Reports' : 'System Reports'}
        description={activeScope === 'self' ? 'Review your personal logs, leaves, and salary slips history.' : 'Comprehensive platform-wide operations reports.'}
        actions={
          tab !== 'dashboard' && (
            <Button onClick={handleDownloadCsv} className="gap-2" variant="outline">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          )
        }
      />

      {/* Scope switch if not forced */}
      {!forcedScope && (
        <div className="flex gap-1 p-1 bg-muted border border-border rounded-xl w-fit">
          <Button
            variant={activeScope === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setScope('all')}
            className="h-8 text-xs font-bold"
          >
            All Reports
          </Button>
          <Button
            variant={activeScope === 'self' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setScope('self')}
            className="h-8 text-xs font-bold"
          >
            Self Reports
          </Button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 p-1 bg-muted border border-border rounded-xl w-full sm:w-auto overflow-x-auto">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTab(t.key as any);
                setSearch('');
              }}
              className="h-8 text-xs font-bold whitespace-nowrap"
            >
              {t.label}
            </Button>
          ))}
        </div>

        {tab !== 'dashboard' && tab !== 'headcount' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {tab !== 'leave' && (
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-background border border-input text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                {MONTH_NAMES.slice(1).map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>{m}</option>
                ))}
              </select>
            )}

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-background border border-input text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {tab === 'attendance' && (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-background border border-input text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="">All Statuses</option>
                {['present', 'absent', 'late', 'half_day', 'leave', 'holiday'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            )}

            {tab === 'leave' && (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-background border border-input text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="">All Statuses</option>
                {['approved', 'pending', 'rejected', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            )}

            {tab === 'payroll' && (
              <div className="flex gap-1 bg-muted p-0.5 rounded-lg border border-border">
                {[
                  { key: 'register', label: 'Register' },
                  { key: 'lop', label: 'LOP' },
                  { key: 'ot', label: 'Overtime' },
                ].map((v) => (
                  <Button
                    key={v.key}
                    variant={payrollView === v.key ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-[10px] font-bold px-2.5"
                    onClick={() => setPayrollView(v.key as any)}
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab !== 'dashboard' && (
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name..."
              className="pl-8 h-8.5 text-xs"
            />
          </div>
        )}
      </div>

      {/* Main Reports Content */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading report entries...
        </div>
      ) : (
        <div className="space-y-4">
          {tab === 'dashboard' && renderDashboard()}
          {tab === 'attendance' && renderAttendance()}
          {tab === 'leave' && renderLeave()}
          {tab === 'payroll' && renderPayroll()}
          {tab === 'headcount' && renderHeadcount()}
        </div>
      )}
    </div>
  );
}




