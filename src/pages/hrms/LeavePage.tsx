/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  Calendar,
  CalendarCheck,
  ClipboardList,
  Sliders,
  Wallet,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
  User,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { leaveService, LeaveType, LeaveBalance, LeaveRequest, Holiday } from '@/services/leave';
import { employeeService, EmployeeOption } from '../../services/employees';
import { usePermissions } from '@/auth/usePermissions';

// --- STYLING CONSTANTS ---
const CARD_CLASS = "bg-slate-950/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6 shadow-xl";
const INPUT_CLASS = "w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all";
const SELECT_CLASS = "w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all";
const LABEL_CLASS = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";

const STATUS_BADGES = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-455 border-rose-500/20",
  cancelled: "bg-slate-800/40 text-slate-400 border-slate-700/50",
};

const employeeFilterValue = (employee: EmployeeOption) => employee.attendance_id || String(employee.user_id);

interface AxiosErrorLike {
  response?: {
    data?: {
      error?: string;
      detail?: string;
      name?: string[];
      code?: string[];
      date?: string[];
    };
  };
}

// --- SUB-COMPONENT: BalanceDashboard ---
function BalanceDashboard() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [lowThreshold, setLowThreshold] = useState(2);
  const [encashEnabled, setEncashEnabled] = useState(false);

  const loadBalances = useCallback(async () => {
    setLoading(true);
    try {
      const r = await leaveService.getMyBalance(year);
      setBalances(r.data || []);
    } catch {
      toast.error('Failed to load leave balances');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    leaveService.getSystemSettings().then(res => {
      const all = Object.values(res.data).flat();
      const find = (key: string) => all.find(s => s.key === key);

      const lt = find('leave_balance_low_threshold');
      if (lt) setLowThreshold(parseInt(lt.value, 10) || 2);

      const enc = find('leave_encashment_enabled');
      if (enc) setEncashEnabled(enc.value === 'true');
    }).catch(() => { });
  }, []);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const refreshBalances = () => {
    loadBalances();
    toast('Refreshing balances…', { icon: '🔄' });
  };

  const sortedBalances = [...balances].sort((a, b) => {
    const aCF = a.carried_forward || a.carried || 0;
    const bCF = b.carried_forward || b.carried || 0;
    if (aCF === 0 && bCF > 0) return -1;
    if (aCF > 0 && bCF === 0) return 1;
    return (a.leave_type_name || '').localeCompare(b.leave_type_name || '');
  });

  const cfLeaves = sortedBalances.filter(b => (b.remaining || 0) > 0 && b.carry_forward);
  const totalRemaining = balances.reduce((s, b) => s + (b.remaining || 0), 0);
  const totalUsed = balances.reduce((s, b) => s + (b.used || 0), 0);
  const totalPending = balances.reduce((s, b) => s + (b.pending || 0), 0);

  return (
    <div className="space-y-6">
      {/* Dashboard Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" /> Leave Balances — {year}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {totalRemaining.toFixed(1)} days remaining · {totalUsed.toFixed(1)} used
            {totalPending > 0 && (
              <span className="text-amber-500"> · {totalPending.toFixed(1)} pending approval</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshBalances}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl text-xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`text-xs font-bold px-3 py-2 rounded-xl border ${year === thisYear ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>
            {year === thisYear ? '📅 This Year' : year}
          </span>
          {year < thisYear + 1 && (
            <button
              onClick={() => setYear(y => y + 1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl text-xs transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info Banners */}
      {year === thisYear && (
        <div className="flex items-start gap-2 bg-cyan-950/20 border border-cyan-900/30 text-cyan-400 rounded-xl p-4 text-xs leading-relaxed">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>This Year ({year}):</strong> Balances are initialized automatically. New leave types configured by HR will appear here upon refreshing. Current-year leaves are consumed before carry-forward days.
          </div>
        </div>
      )}
      {year === thisYear + 1 && (
        <div className="flex items-start gap-2 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-xs leading-relaxed">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Next Year ({year}) Preview:</strong> Estimated balances including expected carry-forward from {thisYear}. Final amounts are set after year-end processing.
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
          Loading balances…
        </div>
      ) : sortedBalances.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/20 border border-slate-850 rounded-2xl">
          <p className="text-sm text-slate-400">No leave balances found for {year}.</p>
          <p className="text-xs text-slate-500 mt-2">Click <strong>Refresh</strong> to initialize balances or contact HR.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBalances.map(b => {
            const remaining = b.remaining || 0;
            const used = b.used || 0;
            const pending = b.pending || 0;
            const total = b.total || 0;
            const carried = b.carried_forward || b.carried || 0;
            const isLow = remaining <= lowThreshold && remaining > 0;
            const isEmpty = remaining === 0 && total > 0;
            const usedPct = total > 0 ? (used / total) * 100 : 0;
            const pendingPct = total > 0 ? (pending / total) * 100 : 0;

            return (
              <div
                key={b.id || b.leave_type_id}
                className={`bg-slate-950/40 backdrop-blur-md border rounded-2xl p-5 shadow-xl relative flex flex-col justify-between ${isEmpty ? 'border-rose-900/40' : isLow ? 'border-amber-900/40' : carried > 0 ? 'border-blue-900/40' : 'border-slate-800'
                  }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{b.leave_type_name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-0.5">
                      {b.leave_type_code}
                    </span>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${b.is_paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'}`}>
                        {b.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                      {carried > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          🔄 +{carried.toFixed(1)} CF
                        </span>
                      )}
                      {isLow && !isEmpty && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                          ⚠️ Low
                        </span>
                      )}
                      {isEmpty && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-500/10 text-rose-455 border border-rose-500/25">
                          ✕ Exhausted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black leading-none ${isEmpty ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-100'}`}>
                      {remaining.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-1">remaining</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(usedPct, 100)}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(pendingPct, 100 - usedPct)}%` }}
                    />
                  </div>

                  {/* Stat boxes */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Total', value: total.toFixed(1), color: 'text-slate-400' },
                      { label: 'Used', value: used.toFixed(1), color: 'text-rose-400' },
                      { label: 'Pending', value: pending.toFixed(1), color: 'text-amber-400' },
                      { label: 'Left', value: remaining.toFixed(1), color: 'text-emerald-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-900/50 border border-slate-850 rounded-xl p-2 text-center">
                        <p className={`text-[11px] font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Encashment suggestion */}
                  {encashEnabled && b.leave_type_code === 'EL' && remaining > 0 && (
                    <p className="text-[10px] text-purple-400 flex items-center gap-1 mt-1 bg-purple-950/10 border border-purple-900/20 rounded-lg p-2">
                      💡 EL encashment available at year-end. (Max CF: {b.max_carry_forward ?? 0} days)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Next Year CF Preview */}
      {year === thisYear && cfLeaves.length > 0 && (
        <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-6">
          <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
            🔄 Estimated Carry-Forward to {thisYear + 1}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Based on current remaining balance. Capped per policy. Final amounts are locked during year-end processing.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {cfLeaves.map(b => {
              const remaining = b.remaining || 0;
              const maxCF = b.max_carry_forward || 0;
              const estimated = Math.min(remaining, maxCF);
              return (
                <div key={b.id} className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 text-center">
                  <p className="text-[11px] text-slate-400 font-semibold truncate">{b.leave_type_name}</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{estimated.toFixed(1)}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {remaining > maxCF ? `capped (from ${remaining.toFixed(1)})` : 'of current bal'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: ApplyLeave ---
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function ApplyLeave({ onApplied }: { onApplied: () => void }) {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balance, setBalance] = useState<LeaveBalance[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    session: 'full',
    reason: '',
    doc_url: ''
  });
  const [days, setDays] = useState(0);
  const [weekendDays, setWeekendDays] = useState<string[]>(['saturday', 'sunday']);
  const [halfDayEnabled, setHalfDayEnabled] = useState(true);
  const [clMonthCap, setClMonthCap] = useState(0);
  const [slDocDays, setSlDocDays] = useState(2);

  useEffect(() => {
    leaveService.getLeaveTypes().then(r => setTypes(r.data)).catch(() => { /* ignore */ });
    leaveService.getMyBalance(new Date().getFullYear()).then(r => setBalance(r.data)).catch(() => { /* ignore */ });

    leaveService.getSystemSettings().then(res => {
      const all = Object.values(res.data).flat();
      const find = (key: string) => all.find(s => s.key === key);

      const wknd = find('weekend_days');
      if (wknd) {
        try {
          setWeekendDays(JSON.parse(wknd.value));
        } catch {
          /* ignore */
        }
      }

      const halfDay = find('half_day_leave_enabled');
      if (halfDay) setHalfDayEnabled(halfDay.value === 'true');

      const cap = find('cl_monthly_cap');
      if (cap) setClMonthCap(parseInt(cap.value, 10) || 0);

      const slDoc = find('sl_doc_required_after_days');
      if (slDoc) setSlDocDays(parseInt(slDoc.value, 10) || 2);
    }).catch(() => { /* ignore */ });
  }, []);

  const isWorkingDay = useCallback((d: Date) => !weekendDays.includes(DAY_NAMES[d.getDay()]), [weekendDays]);

  const countWorkingDays = useCallback((from: Date, to: Date) => {
    let count = 0;
    const cur = new Date(from);
    while (cur <= to) {
      if (isWorkingDay(cur)) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [isWorkingDay]);

  useEffect(() => {
    if (!form.start_date || !form.end_date) {
      setDays(0);
      return;
    }
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (end < start) {
      setDays(0);
      return;
    }
    if (form.session !== 'full') {
      setDays(0.5);
      return;
    }
    setDays(countWorkingDays(start, end));
  }, [form.start_date, form.end_date, form.session, countWorkingDays]);

  const setField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const selectedBal = balance.find(b => b.leave_type_id === parseInt(form.leave_type, 10));
  const remaining = selectedBal ? selectedBal.remaining : null;
  const insufficient = remaining !== null && days > remaining;
  const selectedType = types.find(t => t.id === parseInt(form.leave_type, 10));

  const needsDoc = selectedType?.code === 'SL' && days > slDocDays;
  const isClOverCap = selectedType?.code === 'CL' && clMonthCap > 0;

  const advanceNoticeRequired = selectedType ? (selectedType.min_notice_days || 0) : 0;

  const getNoticeDaysFromToday = () => {
    if (!form.start_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(form.start_date);
    if (start <= today) return 0;
    return countWorkingDays(today, start) - 1; // Exclude start date itself
  };

  const noticeDaysFromToday = getNoticeDaysFromToday();
  const noticeViolation = advanceNoticeRequired > 0 &&
    noticeDaysFromToday !== null &&
    noticeDaysFromToday < advanceNoticeRequired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type || !form.start_date || !form.end_date || !form.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (insufficient) {
      toast.error('Insufficient leave balance');
      return;
    }
    if (noticeViolation && selectedType) {
      toast.error(`${selectedType.name} requires ${advanceNoticeRequired} working day(s) advance notice.`);
      return;
    }

    setSaving(true);
    try {
      await leaveService.applyLeave(form);
      toast.success('Leave request submitted!');
      onApplied();
    } catch (err: unknown) {
      const error = err as AxiosErrorLike;
      toast.error(error.response?.data?.error || 'Failed to submit leave application');
    } finally {
      setSaving(false);
    }
  };

  const submitDisabled = saving || insufficient || !form.leave_type || noticeViolation;

  return (
    <div className="max-w-2xl mx-auto">
      <div className={CARD_CLASS}>
        <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-cyan-400" /> Submit Leave Application
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Leave Type */}
          <div>
            <label className={LABEL_CLASS}>Leave Type *</label>
            <select
              value={form.leave_type}
              onChange={e => setField('leave_type', e.target.value)}
              className={SELECT_CLASS}
              required
            >
              <option value="">— Select leave type —</option>
              {types.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code}){!t.is_paid ? ' — Unpaid' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Balance Preview Card */}
          {selectedBal && (
            <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Available Balance:</span>
              <span className={`text-sm font-black ${remaining !== null && remaining <= 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                {remaining !== null ? `${remaining.toFixed(1)} days` : 'N/A'}
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Start Date *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setField('start_date', e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>End Date *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setField('end_date', e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>

          {/* Half Day Session Options */}
          {halfDayEnabled && form.start_date && form.end_date && form.start_date === form.end_date && (
            <div>
              <label className={LABEL_CLASS}>Leave Duration *</label>
              <select
                value={form.session}
                onChange={e => setField('session', e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="full">Full Day</option>
                <option value="first_half">First Half (Morning)</option>
                <option value="second_half">Second Half (Afternoon)</option>
              </select>
            </div>
          )}

          {/* Calculated Duration */}
          {days > 0 && (
            <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Total Leave Requested:</span>
                <span className="font-bold text-cyan-400">{days.toFixed(1)} Day(s)</span>
              </div>

              {/* SL Doc Required Warning */}
              {needsDoc && (
                <div className="text-amber-500 flex items-start gap-1.5 mt-2 bg-amber-950/10 border border-amber-900/20 p-2.5 rounded-lg">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Medical certificate required for Sick Leave exceeding {slDocDays} days. Please upload to a file hosting service and share the link below.</span>
                </div>
              )}

              {/* CL Month Cap Warning */}
              {isClOverCap && (
                <div className="text-cyan-400 flex items-start gap-1.5 mt-2 bg-cyan-950/10 border border-cyan-900/20 p-2.5 rounded-lg">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Maximum Casual Leave allowed per request is {clMonthCap} days. Excess will be adjusted by admin review.</span>
                </div>
              )}

              {/* Notice violation Warning */}
              {noticeViolation && selectedType && (
                <div className="text-rose-500 flex items-start gap-1.5 mt-2 bg-rose-950/10 border border-rose-900/20 p-2.5 rounded-lg">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Notice violation: {selectedType.name} requires {advanceNoticeRequired} days advance notice. You cannot submit this request.</span>
                </div>
              )}

              {/* Insufficient balance warning */}
              {insufficient && (
                <div className="text-rose-500 flex items-start gap-1.5 mt-2 bg-rose-950/10 border border-rose-900/20 p-2.5 rounded-lg">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Insufficient leave balance. You only have {remaining?.toFixed(1)} day(s) left.</span>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className={LABEL_CLASS}>Reason *</label>
            <textarea
              value={form.reason}
              onChange={e => setField('reason', e.target.value)}
              className={`${INPUT_CLASS} h-20 resize-y`}
              placeholder="Provide a brief explanation for your leave..."
              required
            />
          </div>

          {/* Document URL */}
          <div>
            <label className={LABEL_CLASS}>Supporting Document Link (optional)</label>
            <input
              type="url"
              value={form.doc_url}
              onChange={e => setField('doc_url', e.target.value)}
              className={INPUT_CLASS}
              placeholder="e.g. https://drive.google.com/file/..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:hover:bg-cyan-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/15 cursor-pointer"
            >
              {saving ? 'Submitting…' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: MyRequests ---
const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function MyRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const r = await leaveService.getMyRequests(filter || undefined);
      setRequests(r.data || []);
    } catch {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await leaveService.cancelLeave(id);
      toast.success('Leave request cancelled');
      loadRequests();
    } catch (err: unknown) {
      const error = err as AxiosErrorLike;
      toast.error(error.response?.data?.error || 'Unable to cancel leave request');
    }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-850 pb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${filter === f.value
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/20 border border-slate-850 rounded-2xl">
          <p className="text-4xl mb-3">🌴</p>
          <p className="text-sm text-slate-400 font-semibold">No leave requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(req => {
            const badgeClass = STATUS_BADGES[req.status] || STATUS_BADGES.pending;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(req.start_date);
            const canCancel = req.status === 'pending' || (req.status === 'approved' && startDate > today);

            return (
              <div key={req.id} className={CARD_CLASS}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-200 text-sm">{req.leave_type_name}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {req.days.toFixed(1)} day{req.days !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">
                      📅 {req.start_date} {req.start_date !== req.end_date ? `→ ${req.end_date}` : ''}
                      {req.session !== 'full' && (
                        <span className="ml-1.5 text-[10px] text-cyan-400 font-bold uppercase tracking-wide">
                          ({req.session.replace('_', ' ')})
                        </span>
                      )}
                    </p>

                    <p className="text-xs text-slate-400">Reason: {req.reason}</p>

                    {req.doc_url && (
                      <a
                        href={req.doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold mt-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Attached Document
                      </a>
                    )}

                    {req.approver_name && (
                      <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-3 mt-2 text-xs">
                        <p className="text-slate-300 font-medium flex items-center gap-1.5">
                          {req.status === 'approved' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          Reviewed by {req.approver_name}
                        </p>
                        {req.approver_note && (
                          <p className="text-slate-400 italic mt-1 font-mono">"{req.approver_note}"</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between gap-3 text-right">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Applied: {new Date(req.applied_at).toLocaleDateString('en-IN')}
                    </span>

                    {canCancel && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${req.status === 'approved'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                            : 'bg-rose-500/10 text-rose-455 border-rose-500/25 hover:bg-rose-500/20'
                          }`}
                      >
                        {req.status === 'approved' ? 'Withdraw' : 'Cancel'}
                      </button>
                    )}

                    {req.status === 'approved' && !canCancel && (
                      <span className="text-xs text-slate-500 italic">Leave in progress</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: LeaveApprovals ---
interface PriorUsageData {
  has_prior: boolean;
  requested_days: number;
  leave_type: string;
  employee_name: string;
  month: string;
  total_prior_days: number;
  prior_approved: LeaveRequest[];
  prior_pending: LeaveRequest[];
  is_compensatory?: boolean;
  comp_off?: {
    available_days: number;
    worked_days: number;
    used_or_pending_days: number;
    worked_dates: Array<{ date: string; type: string; check_in?: string; check_out?: string }>;
  };
  annual_balance?: {
    total: number;
    used: number;
    pending: number;
    remaining: number;
  };
}

interface PriorUsageModalProps {
  data: PriorUsageData;
  note: string;
  onNoteChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function PriorUsageModal({ data, note, onNoteChange, onConfirm, onCancel, loading }: PriorUsageModalProps) {
  const hasPrior = data.has_prior;
  const annualBal = data.annual_balance;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-5 border-b border-slate-800 ${hasPrior ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
          <p className={`text-[10px] font-bold tracking-widest uppercase ${hasPrior ? 'text-amber-400' : 'text-emerald-400'}`}>
            {hasPrior ? '⚠️ Prior Leave Found' : '✅ No Prior Leave This Month'}
          </p>
          <h3 className="text-base font-bold text-slate-200 mt-1">
            Approve {data.requested_days.toFixed(1)} day(s) of {data.leave_type}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.employee_name} · {data.month}
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-thin">
          {/* Annual balance bar */}
          {annualBal && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 uppercase tracking-wide">Annual Balance</span>
                <span className="text-slate-300">{annualBal.remaining.toFixed(1)} / {annualBal.total.toFixed(1)} days left</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-850">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${Math.min((annualBal.used / annualBal.total) * 100, 100)}%` }}
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${Math.min((annualBal.pending / annualBal.total) * 100, 100 - (annualBal.used / annualBal.total) * 100)}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2">
                {[
                  { label: 'Used', val: annualBal.used, color: 'bg-cyan-500' },
                  { label: 'Pending', val: annualBal.pending, color: 'bg-amber-500' },
                  { label: 'Remaining', val: annualBal.remaining, color: 'bg-emerald-500' },
                ].map(item => (
                  <span key={item.label} className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-sm ${item.color}`} />
                    {item.label}: <b className="text-slate-200">{item.val.toFixed(1)}d</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comp off worked days check */}
          {data.is_compensatory && data.comp_off && (
            <div className="bg-blue-500/10 border border-blue-900/30 p-4 rounded-xl text-xs space-y-2">
              <p className="font-bold text-blue-400">
                Extra worked days available: {data.comp_off.available_days}
              </p>
              <p className="text-slate-400">
                Worked on weekend/holiday: {data.comp_off.worked_days} day(s) · Used/Pending comp-off: {data.comp_off.used_or_pending_days} day(s)
              </p>
              <div className="space-y-1.5 mt-2">
                {(data.comp_off.worked_dates || []).slice(0, 6).map((d) => (
                  <div key={d.date} className="flex justify-between text-[11px] text-blue-300 font-mono bg-blue-950/20 px-2 py-1 rounded">
                    <span>{d.date} ({d.type})</span>
                    <span>{d.check_in || '—'} → {d.check_out || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prior leaves table */}
          {hasPrior ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-amber-400">
                Already taken {data.leave_type} this month ({data.total_prior_days.toFixed(1)} days):
              </p>
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {[...data.prior_approved, ...data.prior_pending].map(r => (
                  <div key={r.id} className="flex justify-between items-center p-3 bg-slate-950/30 text-xs font-medium">
                    <span className="text-slate-300">
                      {r.start_date === r.end_date ? r.start_date : `${r.start_date} → ${r.end_date}`}
                    </span>
                    <span className="font-bold text-slate-100">{r.days.toFixed(1)}d</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${STATUS_BADGES[r.status]}`}>
                      {r.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(r.applied_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-xl border border-emerald-900/20 text-xs font-semibold">
              No other {data.leave_type} requests found for {data.month}.
            </div>
          )}

          {/* Note input */}
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Approver Note (optional)</label>
            <textarea
              value={note}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="Add feedback visible to the employee..."
              className={`${INPUT_CLASS} h-16 resize-y`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/20">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            {loading ? 'Approving…' : hasPrior ? 'OK, Approve Anyway' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveApprovals() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [employeeFilter, setEmployeeFilter] = useState('');

  const [popup, setPopup] = useState<{ leaveId: number; data: PriorUsageData } | null>(null);
  const [popupNote, setPopupNote] = useState('');
  const [popupLoading, setPopupLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const r = await leaveService.getAllRequests(filter || undefined, employeeFilter || undefined);
      setRequests(r.data || []);
    } catch {
      toast.error('Failed to load leave approvals');
    } finally {
      setLoading(false);
    }
  }, [filter, employeeFilter]);

  const loadEmployees = useCallback(async () => {
    try {
      const r = await employeeService.list({ active: true });
      setEmployees(r.data || []);
    } catch {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleApproveClick = async (req: LeaveRequest) => {
    setCheckingId(req.id);
    try {
      const res = await leaveService.getLeavePriorUsage(req.id);
      setPopup({ leaveId: req.id, data: res.data });
      setPopupNote('');
    } catch {
      toast.error('Could not fetch prior usage logs');
    } finally {
      setCheckingId(null);
    }
  };

  const handleConfirmApprove = async () => {
    if (!popup) return;
    setPopupLoading(true);
    try {
      await leaveService.leaveAction(popup.leaveId, 'approve', popupNote);
      toast.success('Leave request approved!');
      setPopup(null);
      setPopupNote('');
      loadRequests();
    } catch (err: unknown) {
      const error = err as AxiosErrorLike;
      toast.error(error.response?.data?.error || 'Approval failed');
    } finally {
      setPopupLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    const note = prompt('Please provide a reason for rejection (optional):');
    if (note === null) return; // cancelled prompt

    try {
      await leaveService.leaveAction(id, 'reject', note);
      toast.success('Leave request rejected');
      loadRequests();
    } catch (err: unknown) {
      const error = err as AxiosErrorLike;
      toast.error(error.response?.data?.error || 'Rejection failed');
    }
  };

  const tabs = ['pending', 'approved', 'rejected', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Modal */}
      {popup && (
        <PriorUsageModal
          data={popup.data}
          note={popupNote}
          onNoteChange={setPopupNote}
          onConfirm={handleConfirmApprove}
          onCancel={() => setPopup(null)}
          loading={popupLoading}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-850 pb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
        {tabs.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all uppercase tracking-wider cursor-pointer ${filter === s
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
          >
            {s}
          </button>
        ))}
        <select
          value={employeeFilter}
          onChange={(event) => setEmployeeFilter(event.target.value)}
          className="ml-auto min-w-[220px] px-3 py-2 rounded-xl text-xs font-semibold border bg-slate-900/40 border-slate-850 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="">All visible employees</option>
          {employees.map((employee) => (
            <option key={employee.user_id} value={employeeFilterValue(employee)}>
              {employee.display_name || `${employee.first_name} ${employee.last_name}`.trim() || employee.username}
              {employee.emp_code ? ` (${employee.emp_code})` : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
          Loading team requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/20 border border-slate-850 rounded-2xl">
          <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">No {filter} requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(req => {
            const badgeClass = STATUS_BADGES[req.status] || STATUS_BADGES.pending;

            return (
              <div key={req.id} className={CARD_CLASS}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* User profile info */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                        {req.employee_name?.[0] || <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-sm">{req.employee_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{req.emp_code || `#EMP-${req.employee_id}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider bg-cyan-950/40 border border-cyan-900/30 px-2 py-0.5 rounded">
                        {req.leave_type_name}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {req.days.toFixed(1)} day{req.days !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">
                      📅 {req.start_date} {req.start_date !== req.end_date ? `→ ${req.end_date}` : ''}
                    </p>

                    <p className="text-xs text-slate-400">Reason: {req.reason}</p>

                    {req.doc_url && (
                      <a
                        href={req.doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold mt-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Attached Document
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end justify-between gap-3 md:text-right">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Submitted: {new Date(req.applied_at).toLocaleDateString('en-IN')}
                    </span>

                    {/* Pending actions */}
                    {filter === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 border border-rose-500/25 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveClick(req)}
                          disabled={checkingId === req.id}
                          className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {checkingId === req.id ? 'Checking…' : 'Approve'}
                        </button>
                      </div>
                    )}

                    {/* Review info */}
                    {filter !== 'pending' && req.approver_name && (
                      <div className="text-xs text-slate-500">
                        <span>Reviewed by: {req.approver_name}</span>
                        {req.approver_note && (
                          <p className="italic mt-1 text-slate-400 font-mono">"{req.approver_note}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: LeaveTypeConfig ---
const EMPTY_LEAVE_TYPE = {
  name: '',
  code: '',
  days_allowed: 12,
  applicable_to: 'all',
  carry_forward: false,
  max_carry_forward: 0,
  is_paid: true,
  requires_document: false,
  min_notice_days: 0,
  description: '',
};

function LeaveTypeConfig() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [form, setForm] = useState<Partial<LeaveType>>(EMPTY_LEAVE_TYPE);
  const [saving, setSaving] = useState(false);
  const [syncInfo, setSyncInfo] = useState<{ year: number; created: number; updated: number; skipped: number } | null>(null);

  const loadTypes = async () => {
    setLoading(true);
    try {
      const r = await leaveService.getLeaveTypes();
      setTypes(r.data || []);
    } catch {
      toast.error('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_LEAVE_TYPE);
    setShowForm(true);
    setSyncInfo(null);
  };

  const openEdit = (t: LeaveType) => {
    setEditing(t);
    setForm({ ...t });
    setShowForm(true);
    setSyncInfo(null);
  };

  const setField = (key: keyof LeaveType, value: string | number | boolean | undefined) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      let res;
      if (editing) {
        res = await leaveService.updateLeaveType(editing.id, form);
        toast.success('Leave type updated!');
      } else {
        res = await leaveService.createLeaveType(form);
        toast.success('Leave type created!');
      }

      const sync = res?.data?.balance_sync;
      if (sync) {
        setSyncInfo(sync);
        if (sync.created > 0 || sync.updated > 0) {
          toast.success(
            `Balance sync: ${sync.created} new + ${sync.updated} updated across employees`,
            { duration: 5000, icon: '🔄' }
          );
        }
      }

      setShowForm(false);
      loadTypes();
    } catch (err: unknown) {
      const error = err as AxiosErrorLike;
      const respData = error.response?.data;
      toast.error(respData?.name?.[0] || respData?.code?.[0] || 'Save operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: LeaveType) => {
    if (!window.confirm(`Delete "${t.name}" leave type?`)) return;

    try {
      await leaveService.deleteLeaveType(t.id);
      toast.success('Leave type deleted');
      loadTypes();
    } catch (err: unknown) {
      const error = err as AxiosErrorLike;
      toast.error(error?.response?.data?.error || 'Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" /> Leave Type Configurations
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Updating settings triggers employee balance syncing.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/15 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Leave Type
        </button>
      </div>

      {/* Sync banner */}
      {syncInfo && (
        <div className="flex justify-between items-center bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 p-4 rounded-xl text-xs leading-normal">
          <span>
            🔄 <strong>Balance Sync Complete ({syncInfo.year}):</strong> {syncInfo.created} rows created · {syncInfo.updated} rows updated · {syncInfo.skipped} skipped
          </span>
          <button
            onClick={() => setSyncInfo(null)}
            className="text-emerald-400 hover:text-emerald-300 font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
          Loading configs...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map(t => (
            <div key={t.id} className={`${CARD_CLASS} flex flex-col justify-between h-full space-y-4`}>
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{t.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider">{t.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-cyan-400">{t.days_allowed}</span>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">days/year</p>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap mt-3">
                  {[
                    { label: t.is_paid ? 'Paid' : 'Unpaid', color: t.is_paid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-rose-500/10 text-rose-455 border-rose-500/25' },
                    { label: t.applicable_to, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
                    { label: t.carry_forward ? `CF max ${t.max_carry_forward}d` : 'No Carry', color: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
                    { label: t.requires_document ? 'Doc Required' : '', color: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
                    { label: t.min_notice_days > 0 ? `${t.min_notice_days}d notice` : '', color: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
                  ].filter(p => p.label).map(p => (
                    <span key={p.label} className={`text-[9px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-wider ${p.color}`}>
                      {p.label}
                    </span>
                  ))}
                </div>

                {t.description && (
                  <p className="text-xs text-slate-400 mt-3 border-t border-slate-900 pt-3">{t.description}</p>
                )}
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-900">
                <button
                  onClick={() => openEdit(t)}
                  className="flex-1 px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800 text-slate-200 border border-slate-850 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 border border-rose-500/25 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 bg-slate-955">
              <h3 className="text-sm font-bold text-slate-200">
                {editing ? '✏️ Edit Leave Type' : '➕ Add Leave Type'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {editing ? 'Saving automatically syncs current balances.' : 'New leave types initialize balances for all active users.'}
              </p>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-thin">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Name *</label>
                  <input
                    value={form.name || ''}
                    onChange={e => setField('name', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Casual Leave"
                    required
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Code *</label>
                  <input
                    value={form.code || ''}
                    onChange={e => setField('code', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="CL"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Days Allowed / Year</label>
                  <input
                    type="number"
                    min="0"
                    value={form.days_allowed ?? 12}
                    onChange={e => setField('days_allowed', parseInt(e.target.value, 10) || 0)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Min Notice Days Required</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_notice_days ?? 0}
                    onChange={e => setField('min_notice_days', parseInt(e.target.value, 10) || 0)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Applicable To</label>
                <select
                  value={form.applicable_to || 'all'}
                  onChange={e => setField('applicable_to', e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="all">All Employees</option>
                  <option value="regular">Regular</option>
                  <option value="contract">Contract</option>
                  <option value="parttime">Part-Time</option>
                  <option value="intern">Intern</option>
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS}>Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setField('description', e.target.value)}
                  className={`${INPUT_CLASS} h-16 resize-y`}
                  placeholder="Leave policy overview description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'is_paid', label: 'Paid Leave' },
                  { key: 'carry_forward', label: 'Carry Forward' },
                  { key: 'requires_document', label: 'Doc Required' },
                ].map(toggle => (
                  <label key={toggle.key} className="flex items-center gap-2.5 bg-slate-950/40 border border-slate-850 p-3 rounded-xl cursor-pointer text-xs font-semibold text-slate-300 hover:bg-slate-950 transition-colors">
                    <input
                      type="checkbox"
                      checked={!!form[toggle.key as keyof LeaveType]}
                      onChange={e => setField(toggle.key as keyof LeaveType, e.target.checked)}
                      className="w-4.5 h-4.5 accent-cyan-500 rounded border-slate-850"
                    />
                    {toggle.label}
                  </label>
                ))}
              </div>

              {form.carry_forward && (
                <div>
                  <label className={LABEL_CLASS}>Max Carry Forward Days</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_carry_forward ?? 0}
                    onChange={e => setField('max_carry_forward', parseInt(e.target.value, 10) || 0)}
                    className={INPUT_CLASS}
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/20">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-955 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                {saving ? 'Saving & Syncing...' : 'Save Config'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: HolidayConfig ---
function HolidayConfig() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState({ date: '', name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const r = await leaveService.getHolidays();
      setHolidays(r.data || []);
    } catch {
      toast.error('Failed to load holidays calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ date: '', name: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (h: Holiday) => {
    setEditing(h);
    setForm({ date: h.date, name: h.name, description: h.description || '' });
    setShowForm(true);
  };

  const setField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.name.trim()) {
      toast.error('Date and name are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await leaveService.updateHoliday(editing.id, form);
        toast.success('Holiday updated!');
      } else {
        await leaveService.createHoliday(form);
        toast.success('Holiday added!');
      }
      setShowForm(false);
      loadHolidays();
    } catch (err: unknown) {
      const error = err as AxiosErrorLike;
      const respData = error?.response?.data;
      toast.error(respData?.date?.[0] || respData?.name?.[0] || respData?.detail || 'Save operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (h: Holiday) => {
    const displayDate = new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!window.confirm(`Delete holiday "${h.name}" on ${displayDate}?`)) return;

    setDeletingId(h.id);
    try {
      await leaveService.deleteHoliday(h.id);
      toast.success('Holiday deleted');
      loadHolidays();
    } catch (err: unknown) {
      const error = err as AxiosErrorLike;
      toast.error(error?.response?.data?.error || 'Deletion failed');
    } finally {
      setDeletingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = holidays.filter(h => h.date >= todayStr);
  const past = holidays.filter(h => h.date < todayStr);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" /> Holiday Calendar
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Holidays are calculated as paid present days in payroll.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/15 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Holiday
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-cyan-950/20 border border-cyan-900/30 text-cyan-400 rounded-xl p-4 text-xs leading-relaxed">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Holiday Rule System:</strong> Dates listed here count automatically as paid time off for everyone. In attendance, they are marked as <strong>Public Holiday (PH)</strong> and counted as present in payroll to avoid LOP deduction.
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
          Loading holidays...
        </div>
      ) : holidays.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/20 border border-slate-850 rounded-2xl">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm text-slate-400 font-semibold">No holidays registered yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <HolidaySection title={`📅 Upcoming Holidays (${upcoming.length})`} titleColor="text-cyan-400" bg="bg-cyan-950/10">
              {upcoming.map(h => (
                <HolidayRow key={h.id} h={h} onEdit={openEdit} onDelete={handleDelete} deletingId={deletingId} isUpcoming />
              ))}
            </HolidaySection>
          )}
          {past.length > 0 && (
            <HolidaySection title={`📂 Past Holidays (${past.length})`} titleColor="text-slate-400" bg="bg-slate-900/40" startCollapsed>
              {past.map(h => (
                <HolidayRow key={h.id} h={h} onEdit={openEdit} onDelete={handleDelete} deletingId={deletingId} />
              ))}
            </HolidaySection>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 bg-slate-955">
              <h3 className="text-sm font-bold text-slate-200">
                {editing ? '✏️ Edit Holiday' : '➕ Add Holiday'}
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className={LABEL_CLASS}>Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setField('date', e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Holiday Name *</label>
                <input
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. Diwali, Christmas..."
                  required
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  className={`${INPUT_CLASS} h-16 resize-y`}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 p-3.5 rounded-xl text-xs leading-normal">
                🎉 Will be marked as <strong>PH</strong> in attendance and fully compensated in payroll.
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-955">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-955 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                {saving ? 'Saving…' : editing ? 'Update Holiday' : 'Add Holiday'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Collapsible helper for Holiday List
interface HolidaySectionProps {
  title: string;
  titleColor: string;
  bg: string;
  children: React.ReactNode;
  startCollapsed?: boolean;
}

function HolidaySection({ title, titleColor, bg, children, startCollapsed = false }: HolidaySectionProps) {
  const [open, setOpen] = useState(!startCollapsed);
  return (
    <div className="border border-slate-850 rounded-2xl overflow-hidden shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full p-4 ${bg} border-none flex justify-between items-center text-left cursor-pointer`}
      >
        <span className={`text-xs font-bold ${titleColor} uppercase tracking-wider`}>{title}</span>
        <span className={`text-[10px] uppercase font-bold tracking-wider ${titleColor} opacity-70`}>
          {open ? '▲ Collapse' : '▼ Expand'}
        </span>
      </button>
      {open && <div className="bg-slate-950/20 divide-y divide-slate-900">{children}</div>}
    </div>
  );
}

interface HolidayRowProps {
  h: Holiday;
  onEdit: (h: Holiday) => void;
  onDelete: (h: Holiday) => void;
  deletingId: number | null;
  isUpcoming?: boolean;
}

function HolidayRow({ h, onEdit, onDelete, deletingId, isUpcoming = false }: HolidayRowProps) {
  const dateObj = new Date(h.date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
  const formattedStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const daysAway = Math.round((new Date(h.date).getTime() - new Date().getTime()) / 86400000);

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-900/30 transition-all">
      {/* Date badge */}
      <div className={`w-12 h-12 flex flex-col justify-center items-center rounded-xl font-bold flex-shrink-0 text-center ${isUpcoming ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' : 'bg-slate-800 text-slate-400'
        }`}>
        <span className="text-base font-extrabold leading-none">{dateObj.getDate()}</span>
        <span className="text-[9px] uppercase tracking-wider font-semibold mt-0.5">
          {dateObj.toLocaleDateString('en-IN', { month: 'short' })}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-200 text-sm">{h.name}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 uppercase tracking-wide">
            PH
          </span>
          {isUpcoming && daysAway >= 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase tracking-wide">
              {daysAway === 0 ? 'Today!' : daysAway === 1 ? 'Tomorrow' : `in ${daysAway}d`}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">
          {dayName} · {formattedStr}
          {h.description && <span className="text-slate-500 block sm:inline sm:before:content-['·_'] mt-0.5 sm:mt-0">{h.description}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(h)}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(h)}
          disabled={deletingId === h.id}
          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 border border-rose-500/25 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          {deletingId === h.id ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// --- CONTAINER PAGE: LeavePage ---
export function LeavePage() {
  const [activeTab, setActiveTab] = useState('balance');
  const { role, hasAnyPermission, user } = usePermissions();

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  useEffect(() => {
    employeeService.list({ active: true }).then(r => setEmployees(r.data || [])).catch(() => { });
  }, []);

  // Admin tabs are visible to HR/Admin roles
  const isAdminOrHR = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HR';
  const currentUserOption = employees.find(emp => Number(emp.user_id) === Number(user?.id));
  const isManagerOrLead = role === 'MANAGER' ||
    isAdminOrHR ||
    String(currentUserOption?.designation || '').toLowerCase().includes('lead') ||
    String(currentUserOption?.designation || '').toLowerCase().includes('manager') ||
    employees.some(emp => Number(emp.manager) === Number(user?.id));

  const canManageApprovals = isAdminOrHR || hasAnyPermission([
    'view_all_leave', 'approve_leave', 'leave_approve', 'leave_view', 'hrms_leave_approve', 'hrms_leave_view'
  ]) || isManagerOrLead;
  const canConfigureLeave = isAdminOrHR || hasAnyPermission(['configure_leave']);

  const tabs = [
    { key: 'balance', label: 'Balance', icon: Wallet },
    { key: 'apply', label: 'Apply', icon: CalendarCheck },
    { key: 'my', label: 'My Requests', icon: ClipboardList },
    ...(canManageApprovals ? [
      { key: 'approvals', label: 'Approvals', icon: CheckCircle },
    ] : []),
    ...(canConfigureLeave ? [
      { key: 'config', label: 'Leave Types', icon: Sliders },
      { key: 'holidays', label: 'Holidays', icon: Calendar },
    ] : []),
  ];

  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalNode(document.getElementById('hrms-header-portal'));
  }, []);

  const headerContent = (
    <div>
      <h2 className="text-2xl font-black text-foreground tracking-tight"> HRM Leave Portal</h2>
      <p className="text-muted-foreground text-xs mt-1">
        Apply, request approvals, check holiday balances, and manage organization leave types.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {portalNode ? createPortal(headerContent, portalNode) : headerContent}

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-900/60 border border-slate-850 p-1 rounded-2xl flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none shadow-lg">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                  ? 'bg-slate-950 text-cyan-400 shadow-md border border-slate-850/60'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="bg-slate-900/35 border border-slate-850/60 rounded-3xl p-6 shadow-xl relative min-h-[400px]">
        {activeTab === 'balance' && <BalanceDashboard />}
        {activeTab === 'apply' && <ApplyLeave onApplied={() => setActiveTab('my')} />}
        {activeTab === 'my' && <MyRequests />}
        {activeTab === 'approvals' && canManageApprovals && <LeaveApprovals />}
        {activeTab === 'config' && canConfigureLeave && <LeaveTypeConfig />}
        {activeTab === 'holidays' && canConfigureLeave && <HolidayConfig />}
      </div>
    </div>
  );
}