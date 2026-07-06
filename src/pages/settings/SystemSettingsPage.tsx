/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface SystemSetting {
  key: string;
  label: string;
  value: string;
  value_type: 'string' | 'integer' | 'decimal' | 'boolean' | 'json' | 'time';
  description?: string;
  category: string;
}

const CATEGORY_META: Record<string, { label: string; icon: string; desc: string; border: string; bg: string }> = {
  attendance: {
    label: 'Attendance Settings',
    icon: '📅',
    desc: 'Affects: Monthly calendar week-off display, late/OT marking, payroll working days & LOP',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5 text-blue-600 dark:text-blue-400',
  },
  leave: {
    label: 'Leave Policies',
    icon: '🌴',
    desc: 'Affects: Apply Leave form validation, Balance Dashboard, carry-forward, Monthly Calendar, Payroll LOP - also synced with Leave Types config',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
  },
  payroll: {
    label: 'Payroll Settings',
    icon: '💰',
    desc: 'Affects: Payroll engine - PF/ESI/PT/TDS calculations, payslip deduction breakdown',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5 text-amber-600 dark:text-amber-400',
  },
  general: {
    label: 'General Settings',
    icon: '⚙️',
    desc: 'Affects: Payslip header, email subjects, fiscal year, probation eligibility',
    border: 'border-indigo-500/20',
    bg: 'bg-indigo-500/5 text-indigo-600 dark:text-indigo-400',
  },
};

const KEY_IMPACT: Record<string, string[]> = {
  work_days_per_week: ['📅 Calendar', '💰 Payroll working days', '🌴 Leave day count'],
  weekend_days: ['📅 Calendar week-off cells', '💰 Payroll LOP days', '🌴 Apply Leave form'],
  work_start_time: ['📅 Late marking'],
  work_end_time: ['📅 OT calculation'],
  night_shift_enabled: ['📅 Night shift attendance', '💰 Payroll present/LOP'],
  night_shift_start_time: ['📅 Night check-in window', '📅 Late marking'],
  night_shift_end_time: ['📅 Next-day checkout', '📅 OT calculation'],
  work_hours_per_day: ['💰 OT pay rate'],
  grace_period_minutes: ['📅 Late vs Present status'],
  half_day_hours: ['📅 Half Day marking', '💰 LOP 0.5 day'],
  late_marks_per_half_day: ['💰 LOP deduction (late marks)'],
  overtime_multiplier: ['💰 OT pay rate in payroll'],
  regularization_window_days: ['📅 Regularize form date limit'],
  cl_days_per_year: ['🌴 Balance init', '🌴 Apply form remaining'],
  cl_monthly_cap: ['🌴 Apply Leave CL validation'],
  sl_days_per_year: ['🌴 Balance init'],
  el_days_per_year: ['🌴 Balance init'],
  el_max_carry_forward: ['🌴 Carry-forward cap', '🌴 Balance dashboard'],
  sl_doc_required_after_days: ['🌴 Apply Leave document warning'],
  sandwich_rule_enabled: ['🌴 Leave day count'],
  half_day_leave_enabled: ['🌴 Apply Leave session field'],
  leave_balance_low_threshold: ['🌴 Low balance badge'],
  leave_year_basis: ['🌴 Balance year display', '🌴 Carry-forward timing'],
  carry_forward_month: ['🌴 Carry-forward job timing'],
  sl_advance_notice_days: ['🌴 Apply Leave SL date validation', '🌴 Leave Types Edit form'],
  el_advance_notice_days: ['🌴 Apply Leave EL date validation', '🌴 Leave Types Edit form'],
  cl_is_paid: ['💰 Payslip LOP for CL', '🌴 Leave Types Edit form'],
  sl_is_paid: ['💰 Payslip LOP for SL', '🌴 Leave Types Edit form'],
  el_is_paid: ['💰 Payslip LOP for EL', '🌴 Leave Types Edit form'],
  el_carry_forward: ['🌴 EL carry-forward', '🌴 Balance dashboard', '🌴 Leave Types Edit form'],
  pf_employee_percent: ['💰 PF deduction in payslip'],
  pf_employer_percent: ['💰 CTC calculation'],
  esi_threshold_salary: ['💰 ESI eligibility check'],
  esi_employee_percent: ['💰 ESI deduction in payslip'],
  esi_employer_percent: ['💰 CTC calculation'],
  basic_salary_percent: ['💰 Salary Config auto-fill'],
  hra_percent_metro: ['💰 HRA in payslip (metro)'],
  hra_percent_nonmetro: ['💰 HRA in payslip (non-metro)'],
  payroll_lock_day: ['💰 Payroll Runs warning'],
  // tds_flat_percent_contract: ['💰 TDS for contract employees'],
  pt_flat_amount: ['💰 PT deduction in payslip'],
  pt_threshold_salary: ['PT slab cutoff', 'Salary Config preview'],
  pt_below_threshold_amount: ['PT below cutoff', 'Payslip deduction'],
  pt_above_threshold_amount: ['PT above cutoff', 'Payslip deduction'],
  company_name: ['🧾 Payslip header', '📧 Email subject'],
  office_latitude: ['Attendance check-in location', '300m office validation'],
  office_longitude: ['Attendance check-out location', 'Office map marker'],
  office_radius_meters: ['Allowed check-in radius', 'Allowed check-out radius'],
  fiscal_year_start_month: ['💰 Payroll year', '🌴 Fiscal leave year'],
  probation_period_months: ['🌴 EL eligibility for new employees'],
};

const PLACEHOLDERS: Record<string, string> = {
  office_latitude: 'Enter office latitude',
  office_longitude: 'Enter office longitude',
  office_radius_meters: '300',
};

const HIDDEN_KEYS = [
  'work_days_per_week',
  'regularization_window_days',
  'cl_days_per_year',
  'cl_is_paid',
  'el_days_per_year',
  'el_advance_notice_days',
  'el_max_carry_forward',
  'nll_advance_notice_days',
  'maternity_leave_days',
  'nll_carry_forward',
  'nll_days_per_year',
  'nll_is_paid',
  'paternity_leave_days',
  'probation_earned_leave',
  'sl_days_per_year',
  'sl_advance_notice_days',
  'sl_is_paid',
  'pt_slab_json',
  'pt_flat_amount',
  'currency',
  'fiscal_year_start_month',
  'cl_advance_notice_days',
];

const MOCK_SYSTEM_SETTINGS: Record<string, SystemSetting[]> = {
  attendance: [
    { key: 'work_days_per_week', label: 'Work Days Per Week', value: '5', value_type: 'integer', category: 'attendance', description: 'Standard number of business working days' },
    { key: 'weekend_days', label: 'Weekend Days', value: 'Saturday,Sunday', value_type: 'string', category: 'attendance', description: 'Rest days that are excluded from attendance logs' },
    { key: 'work_start_time', label: 'Work Start Time', value: '09:00', value_type: 'time', category: 'attendance', description: 'Shift starting time for check-in validation' },
    { key: 'work_end_time', label: 'Work End Time', value: '18:00', value_type: 'time', category: 'attendance', description: 'Shift ending time for check-out validation' },
    { key: 'grace_period_minutes', label: 'Grace Period (Minutes)', value: '15', value_type: 'integer', category: 'attendance', description: 'Margin allowed for check-in before being marked late' },
    { key: 'half_day_hours', label: 'Half Day Hours', value: '4', value_type: 'integer', category: 'attendance', description: 'Minimum working hours required to avoid LOP deduction' },
    { key: 'late_marks_per_half_day', label: 'Late Marks Per Half Day', value: '3', value_type: 'integer', category: 'attendance', description: 'Accumulation count triggering a half-day pay cut' },
    { key: 'overtime_multiplier', label: 'Overtime Multiplier', value: '1.5', value_type: 'decimal', category: 'attendance', description: 'Hourly pay scale factor applied to approved overtime' },
    { key: 'office_latitude', label: 'Office Latitude', value: '12.9715987', value_type: 'decimal', category: 'attendance', description: 'Office GPS coordinates for geo-fencing check-in validation' },
    { key: 'office_longitude', label: 'Office Longitude', value: '77.5945627', value_type: 'decimal', category: 'attendance', description: 'Office GPS coordinates for geo-fencing check-out validation' },
    { key: 'office_radius_meters', label: 'Office Radius (Meters)', value: '100', value_type: 'integer', category: 'attendance', description: 'Geo-fencing radius limit for mobile check-in validation' },
  ],
  leave: [
    { key: 'cl_monthly_cap', label: 'CL Monthly Cap', value: '2', value_type: 'integer', category: 'leave', description: 'Maximum Casual Leave that can be availed per month' },
    { key: 'sl_doc_required_after_days', label: 'SL Document Required After Days', value: '3', value_type: 'integer', category: 'leave', description: 'Consecutive sick leave days requiring medical certificates' },
    { key: 'sandwich_rule_enabled', label: 'Sandwich Rule Enabled', value: 'true', value_type: 'boolean', category: 'leave', description: 'Include weekend rest days between consecutive leave days' },
    { key: 'half_day_leave_enabled', label: 'Half Day Leave Enabled', value: 'true', value_type: 'boolean', category: 'leave', description: 'Allow applying for half-day leaves' },
    { key: 'leave_balance_low_threshold', label: 'Leave Balance Low Threshold', value: '3', value_type: 'integer', category: 'leave', description: 'Threshold to highlight low balance warning badge' },
    { key: 'leave_year_basis', label: 'Leave Year Basis', value: 'calendar', value_type: 'string', category: 'leave', description: 'Calculation period (Calendar Year vs Fiscal Year)' },
    { key: 'carry_forward_month', label: 'Carry Forward Month', value: 'December', value_type: 'string', category: 'leave', description: 'Target month of year for leave balance carry forward job' },
    { key: 'sl_advance_notice_days', label: 'SL Advance Notice Days', value: '0', value_type: 'integer', category: 'leave', description: 'Minimum notice window required for Sick Leave planning' },
    { key: 'el_advance_notice_days', label: 'EL Advance Notice Days', value: '7', value_type: 'integer', category: 'leave', description: 'Minimum notice window required for Earned Leave planning' },
    { key: 'el_carry_forward', label: 'EL Carry Forward Enabled', value: 'true', value_type: 'boolean', category: 'leave', description: 'Enable carry forward of remaining Earned Leaves' },
  ],
  payroll: [
    { key: 'pf_employee_percent', label: 'PF Employee Contribution (%)', value: '12', value_type: 'decimal', category: 'payroll', description: 'Provident Fund employee deduction percentage' },
    { key: 'pf_employer_percent', label: 'PF Employer Contribution (%)', value: '12', value_type: 'decimal', category: 'payroll', description: 'Provident Fund employer contribution percentage' },
    { key: 'esi_threshold_salary', label: 'ESI Threshold Salary (₹)', value: '21000', value_type: 'integer', category: 'payroll', description: 'Salary threshold limit for ESI eligibility' },
    { key: 'esi_employee_percent', label: 'ESI Employee Contribution (%)', value: '0.75', value_type: 'decimal', category: 'payroll', description: 'ESI employee contribution deduction percentage' },
    { key: 'esi_employer_percent', label: 'ESI Employer Contribution (%)', value: '3.25', value_type: 'decimal', category: 'payroll', description: 'ESI employer contribution percentage' },
    { key: 'basic_salary_percent', label: 'Basic Salary Percentage of CTC (%)', value: '40', value_type: 'decimal', category: 'payroll', description: 'Percentage of total CTC allocated to Basic Salary structure' },
    { key: 'hra_percent_metro', label: 'HRA Metro Percentage (%)', value: '50', value_type: 'decimal', category: 'payroll', description: 'House Rent Allowance percentage for Metro locations' },
    { key: 'hra_percent_nonmetro', label: 'HRA Non-Metro Percentage (%)', value: '40', value_type: 'decimal', category: 'payroll', description: 'House Rent Allowance percentage for Non-Metro locations' },
    { key: 'payroll_lock_day', label: 'Payroll Lock Day of Month', value: '25', value_type: 'integer', category: 'payroll', description: 'Monthly cut-off date to lock attendance registers for processing' },
    // { key: 'tds_flat_percent_contract', label: 'TDS Flat Contractor (%)', value: '10', value_type: 'decimal', category: 'payroll', description: 'Tax deducted at source rate for contract employees' },
    { key: 'pt_below_threshold_amount', label: 'PT Amount Below Cutoff (₹)', value: '0', value_type: 'integer', category: 'payroll', description: 'Professional Tax deduction below threshold cutoff' },
    { key: 'pt_above_threshold_amount', label: 'PT Amount Above Cutoff (₹)', value: '200', value_type: 'integer', category: 'payroll', description: 'Professional Tax deduction above threshold cutoff' },
  ],
  general: [
    { key: 'company_name', label: 'Company Name', value: 'UniversalSaaS Corp', value_type: 'string', category: 'general', description: 'Official registered entity name for payslips & communications' },
    { key: 'probation_period_months', label: 'Probation Period (Months)', value: '6', value_type: 'integer', category: 'general', description: 'Default probation tracking window for new joiners' },
  ]
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Record<string, SystemSetting[]>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    attendance: true,
    leave: true,
    payroll: true,
    general: true,
  });

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.get<Record<string, SystemSetting[]>>('/system-settings/');
      if (res.data && Object.keys(res.data).length > 0) {
        setSettings(res.data);
      } else {
        setSettings(MOCK_SYSTEM_SETTINGS);
      }
    } catch {
      setSettings({});
      setError('Could not load system settings from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setEdits((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await rolesApi.post('/system-settings/', edits);
      toast.success('System settings saved successfully.');
      setEdits({});
      setSaved(true);
      await fetchSettings();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Could not save system settings to backend.');
      toast.error('System settings save failed.');
    } finally {
      setSaving(false);
    }
  };

  const getValue = (s: SystemSetting) => {
    return edits[s.key] !== undefined ? edits[s.key] : s.value;
  };

  const hasChanges = Object.keys(edits).length > 0;

  // Deduplicate and filter categories
  const deduped: Record<string, SystemSetting[]> = {};
  Object.entries(settings).forEach(([cat, items]) => {
    const seen = new Set<string>();
    deduped[cat] = (items || []).filter((s) => {
      if (s.key === 'tds_flat_percent_contract') return false;
      if (s.key.toLowerCase() === 'timezone' || s.key.toLowerCase() === 'time_zone') return false;
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return true;
    });
  });

  const toggleCategory = (cat: string) => {
    setOpenCats((p) => ({ ...p, [cat]: !p[cat] }));
  };

  const renderInput = (setting: SystemSetting) => {
    const isFixedPayrollLock = setting.key === 'payroll_lock_day';
    const value = isFixedPayrollLock ? '1' : getValue(setting);
    const isChanged = edits[setting.key] !== undefined;

    if (setting.value_type === 'boolean') {
      return (
        <div className="flex gap-2 w-full">
          {['true', 'false'].map((opt) => (
            <Button
              key={opt}
              type="button"
              variant={value === opt ? (opt === 'true' ? 'default' : 'destructive') : 'outline'}
              size="sm"
              onClick={() => handleChange(setting.key, opt)}
              className="flex-1 text-xs"
            >
              {opt === 'true' ? '✓ Enabled' : '✗ Disabled'}
            </Button>
          ))}
        </div>
      );
    }

    if (setting.value_type === 'json') {
      return (
        <textarea
          value={value}
          rows={3}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(setting.key, e.target.value)}
          className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full font-mono text-xs ${isChanged ? 'border-amber-500/50 focus-visible:ring-amber-500' : ''}`}
        />
      );
    }

    return (
      <Input
        value={value}
        type={setting.value_type === 'time' ? 'time' : ['integer', 'decimal'].includes(setting.value_type) ? 'number' : 'text'}
        step={setting.value_type === 'decimal' ? '0.01' : '1'}
        placeholder={PLACEHOLDERS[setting.key] || ''}
        disabled={isFixedPayrollLock}
        onChange={(e) => handleChange(setting.key, e.target.value)}
        className={`w-full text-xs ${isChanged ? 'border-amber-500/50 focus-visible:ring-amber-500' : ''}`}
      />
    );
  };

  const renderSetting = (setting: SystemSetting) => {
    const isChanged = edits[setting.key] !== undefined;
    const impacts = KEY_IMPACT[setting.key] || [];

    return (
      <div
        key={setting.key}
        className={`p-4 border rounded-xl flex flex-col md:flex-row md:justify-between md:items-start gap-4 transition-colors ${
          isChanged ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card border-border hover:border-border/80'
        }`}
      >
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground">{setting.label}</span>
            {isChanged && (
              <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] uppercase">
                Modified
              </Badge>
            )}
          </div>

          {setting.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {setting.description.split('\n→')[0]}
            </p>
          )}

          {impacts.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {impacts.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-semibold bg-primary/5 text-primary border border-primary/10 rounded px-1.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="text-[9px] text-muted-foreground pt-1.5 flex items-center gap-1">
            <span>key:</span>
            <code className="bg-muted px-1 py-0.5 rounded font-mono text-[9px] text-foreground">
              {setting.key}
            </code>
            <span>&middot;</span>
            <span className="capitalize">{setting.value_type}</span>
          </div>
        </div>

        <div className="w-full md:w-52 flex-shrink-0">
          {renderInput(setting)}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Global System Settings"
        description="Immediate organizational parameters for attendance logs, leave validation rules, and payroll deductions."
        actions={
          hasChanges && (
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Settings ({Object.keys(edits).length})
            </Button>
          )
        }
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-4 rounded-xl flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 text-xs p-4 rounded-xl flex items-center gap-2.5">
          <CheckCircle className="h-4 w-4" />
          <span>System configuration modified successfully. New parameters apply to subsequent calculations.</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Retrieving organization parameter list...
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(CATEGORY_META).map(([cat, meta]) => {
            const items = deduped[cat] || [];
            const visible = items.filter((s) => !HIDDEN_KEYS.includes(s.key));
            if (visible.length === 0) return null;

            const isOpen = openCats[cat];
            const changedCount = visible.filter((s) => edits[s.key] !== undefined).length;

            return (
              <div key={cat} className={`border rounded-xl overflow-hidden shadow-xs bg-card ${meta.border}`}>
                {/* Category Header */}
                <div
                  onClick={() => toggleCategory(cat)}
                  className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors border-b border-transparent ${
                    isOpen ? 'border-border/80' : ''
                  } ${meta.bg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{meta.label}</h3>
                      <p className="text-[10px] text-muted-foreground leading-tight hidden md:block mt-0.5">{meta.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {changedCount > 0 && (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35 text-[9px] uppercase">
                        {changedCount} Changed
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">{visible.length} params</span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Settings list */}
                {isOpen && (
                  <div className="p-4 space-y-3">
                    {visible.map((s) => renderSetting(s))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


