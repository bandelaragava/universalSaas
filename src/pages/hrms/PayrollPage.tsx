/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Loader2, Plus, Printer, X, Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/auth/usePermissions';
import { payrollService, SalaryStructure, PayrollRun, PayrollRunEntry } from '@/services/payroll';
import { employeeService } from '../../services/employees';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-muted border-border text-muted-foreground', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  processed: { bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500', text: 'text-yellow-500', dot: 'bg-yellow-500' },
  approved: { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-500', text: 'text-blue-500', dot: 'bg-blue-500' },
  locked: { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500', text: 'text-emerald-500', dot: 'bg-emerald-500' },
};

const fmt = (v: number | string | undefined | null) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const n = (v: number | string | undefined | null) => parseFloat(String(v || 0));
const fmtD = (v: number | string | undefined | null) => parseFloat(String(v || 0)).toFixed(1);
const moneyRows = (source: Record<string, number> | undefined, keys: Array<[string, string]>) =>
  keys.map(([key, label]) => ({ key, label, value: n(source?.[key]) })).filter((row) => row.value !== 0);
const javaUserId = (user: any) => String(user?.user_id ?? user?.id ?? user?.userId ?? '');
const javaUserFirstName = (user: any) => String(user?.first_name ?? user?.firstName ?? '').trim();
const javaUserLastName = (user: any) => String(user?.last_name ?? user?.lastName ?? '').trim();
const javaUserName = (user: any) => {
  const fullName = `${javaUserFirstName(user)} ${javaUserLastName(user)}`.trim();
  return fullName || String(user?.display_name ?? user?.name ?? user?.username ?? user?.email ?? 'User');
};
const javaUserEmpCode = (user: any) => String(user?.emp_code ?? user?.employeeId ?? user?.leadId ?? user?.profileData?.emp_code ?? '');
const javaUserEmail = (user: any) => String(user?.email ?? user?.username ?? '');

const FALLBACK_DEFAULTS = {
  basic_percent: 40,
  hra_percent: 50,
  da_percent: 10,
  pf_percent: 12,
  esi_percent: 0.75,
  transport: 1600,
  medical: 1250,
  other_allowance: 0,
  pt: 200,
  pt_threshold: 15000,
  pt_below: 0,
  pt_above: 200,
  hra_metro: 50,
  hra_nonmetro: 40,
  pf_employer: 12,
  esi_employer: 3.25,
  esi_threshold: 21000,
  working_days: 22,
};

export function PayrollPage() {
  const { hasPermission, role, isPlatformAdmin } = usePermissions();

  const normalizedRole = String(role || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const isPayrollAdmin =
    isPlatformAdmin ||
    ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'TENANT_ADMIN', 'HR'].includes(normalizedRole);

  const canProcess = isPayrollAdmin || hasPermission('PAYROLL_PROCESS_PAYROLL') || hasPermission('PAYROLL_PROCESS');
  const canApprove = isPayrollAdmin || hasPermission('PAYROLL_APPROVE_PAYROLL') || hasPermission('PAYROLL_APPROVE');
  const canManage =
    isPayrollAdmin ||
    hasPermission('PAYROLL_CONFIGURE_SALARY') ||
    hasPermission('manage_payroll') ||
    hasPermission('PAYROLL_CONFIGURE') ||
    hasPermission('SALARY_CONFIGURE');

  const [tab, setTab] = useState<'payslips' | 'salary' | 'runs' | 'config'>('payslips');

  // Core Data States
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payslips, setPayslips] = useState<any[]>([]);
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure | null>(null);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeRunDetail, setActiveRunDetail] = useState<{ run: PayrollRun; entries: PayrollRunEntry[]; available_employees: any[] } | null>(null);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employees, setEmployees] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settingsDefaults, setSettingsDefaults] = useState<any>(FALLBACK_DEFAULTS);

  // Loaders
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sub-tabs specific states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [empFilter, setEmpFilter] = useState('');
  const [salaryStructuresList, setSalaryStructuresList] = useState<SalaryStructure[]>([]);

  // Modals & form fields
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    employee: '',
    effective_date: new Date().toISOString().split('T')[0],
    ctc: '',
    basic_percent: '40',
    hra_percent: '50',
    da_percent: '10',
    pf_percent: '12',
    esi_percent: '0.75',
    transport: '1600',
    medical: '1250',
    other_allowance: '0',
    pt: '200',
    is_metro: true,
  });

  const [newRunForm, setNewRunForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    period_start: '',
    period_end: '',
  });

  const [adjEntry, setAdjEntry] = useState<PayrollRunEntry | null>(null);
  const [adjForm, setAdjForm] = useState({
    type: 'bonus',
    amount: '',
    reason: '',
  });

  const [processEmployeeId, setProcessEmployeeId] = useState('all');
  const [expandEntryId, setExpandEntryId] = useState<string | null>(null);

  // Load all foundational details
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Payslips
      const payslipsRes = await payrollService.getMyPayslips();
      setPayslips(payslipsRes.data || []);

      // 2. Personal structure
      try {
        const mySalaryRes = await payrollService.getMySalary();
        setSalaryStructure(mySalaryRes.data || null);
      } catch {
        setSalaryStructure(null);
      }

      // 3. Settings defaults
      try {
        const settingsRes = await payrollService.getPayrollSettingsDefaults();
        if (settingsRes.data) {
          setSettingsDefaults(settingsRes.data);
        }
      } catch {
        setSettingsDefaults(FALLBACK_DEFAULTS);
      }

      // 4. Admin sections
      if (canProcess || canManage) {
        const runsRes = await payrollService.getRuns();
        setRuns(runsRes.data || []);

        const configRes = await payrollService.getSalaryList();
        setSalaryStructuresList(configRes.data || []);

        const empRes = await employeeService.list({ active: true });
        setEmployees(empRes.data || []);
      }
    } catch {
      toast.error('Failed to retrieve payroll elements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canProcess, canManage]);

  const loadRunDetail = async (id: string) => {
    try {
      const res = await payrollService.getRunDetail(id);
      setActiveRunDetail(res.data);
    } catch {
      toast.error('Could not fetch run details register.');
    }
  };

  const handleSelectRun = async (run: PayrollRun) => {
    setSelectedRun(run);
    setExpandEntryId(null);
    setProcessEmployeeId('all');
    await loadRunDetail(run.id);
  };

  // YTD Calculations
  const ytdSummary = useMemo(() => {
    return payslips.reduce(
      (acc, p) => ({
        gross: acc.gross + n(p.gross),
        net: acc.net + n(p.net_pay),
        pf: acc.pf + n(p.pf_employee),
        esi: acc.esi + n(p.esi_employee),
        tds: acc.tds + n(p.tds),
        lop: acc.lop + n(p.lop_deduction),
        ot_pay: acc.ot_pay + n(p.ot_pay),
      }),
      { gross: 0, net: 0, pf: 0, esi: 0, tds: 0, lop: 0, ot_pay: 0 }
    );
  }, [payslips]);

  // Salary Preview Calculator
  const assignPreview = useMemo(() => {
    const ctc = n(assignForm.ctc);
    if (!ctc) return null;
    const esiThreshold = n(settingsDefaults.esi_threshold || 21000);
    const ptThreshold = n(settingsDefaults.pt_threshold_salary || 15000);

    const monthlyCTC = ctc / 12;
    const basic = monthlyCTC * (n(assignForm.basic_percent) / 100);
    const hra = basic * (n(assignForm.hra_percent) / 100);
    const da = basic * (n(assignForm.da_percent) / 100);
    const transport = n(assignForm.transport);
    const medical = n(assignForm.medical);
    const other = n(assignForm.other_allowance);
    const special = Math.max(monthlyCTC - basic - hra - da - transport - medical - other, 0);

    const gross = basic + hra + da + special + transport + medical + other;
    const pt = gross <= ptThreshold ? n(settingsDefaults.pt_below_threshold_amount || 0) : n(settingsDefaults.pt_above_threshold_amount || 200);
    const pf_emp = basic * (n(assignForm.pf_percent) / 100);
    const esi_emp = gross <= esiThreshold ? gross * (n(assignForm.esi_percent) / 100) : 0;
    const total_deductions = pf_emp + esi_emp + pt;
    const net = gross - total_deductions;

    return {
      basic,
      hra,
      da,
      special,
      transport,
      medical,
      other,
      gross,
      pf_emp,
      esi_emp,
      pt,
      total_deductions,
      net,
      esi_exempt: gross > esiThreshold,
    };
  }, [assignForm, settingsDefaults]);

  // Handlers
  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await payrollService.createRun({
        month: newRunForm.month,
        year: newRunForm.year,
        period_start: newRunForm.period_start || undefined,
        period_end: newRunForm.period_end || undefined,
      });
      toast.success(res.data?.period_label ? 'Reopened existing run.' : 'Created new payroll run.');
      setNewRunForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        period_start: '',
        period_end: '',
      });
      await loadData(true);
      if (res.data?.id) {
        setSelectedRun(res.data);
        await loadRunDetail(res.data.id);
      }
    } catch (err) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Could not create payroll run.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRun = async () => {
    if (!selectedRun) return;
    try {
      setSubmitting(true);
      const payload = processEmployeeId !== 'all' ? { employee: processEmployeeId } : {};
      const res = await payrollService.processRun(selectedRun.id, payload);
      toast.success(`Run completed! Total processed: ${res.data?.created || 0} employees.`);
      await loadData(true);
      await loadRunDetail(selectedRun.id);
    } catch (err) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Calculation batch run failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRun = async () => {
    if (!selectedRun) return;
    if (!window.confirm('Approve and lock this payroll? This action is permanent.')) return;
    try {
      setSubmitting(true);
      await payrollService.approveRun(selectedRun.id);
      toast.success('Payroll locked and approved.');
      await loadData(true);
      await loadRunDetail(selectedRun.id);
    } catch (err) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Approval batch run failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjEntry) return;
    if (!adjForm.amount || !adjForm.reason) {
      toast.error('Amount and reason are required');
      return;
    }
    try {
      setSubmitting(true);
      await payrollService.addAdjustment(adjEntry.id, {
        type: adjForm.type,
        amount: adjForm.amount,
        reason: adjForm.reason,
      });
      toast.success('Adjustment credited/debited successfully.');
      setAdjEntry(null);
      setAdjForm({ type: 'bonus', amount: '', reason: '' });
      if (selectedRun) await loadRunDetail(selectedRun.id);
    } catch {
      toast.error('Could not apply adjustments.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.employee || !assignForm.ctc || !assignForm.effective_date) {
      toast.error('Employee, CTC, and effective date are required.');
      return;
    }
    const selectedEmployee = employees.find((emp) => javaUserId(emp) === assignForm.employee);
    try {
      setSubmitting(true);
      const res = await payrollService.createSalary({
        employee: parseInt(assignForm.employee),
        java_user_id: assignForm.employee,
        employee_email: selectedEmployee ? javaUserEmail(selectedEmployee) : undefined,
        employee_first_name: selectedEmployee ? javaUserFirstName(selectedEmployee) : undefined,
        employee_last_name: selectedEmployee ? javaUserLastName(selectedEmployee) : undefined,
        employee_username: selectedEmployee ? javaUserEmail(selectedEmployee) || javaUserName(selectedEmployee) : undefined,
        employee_type: selectedEmployee?.profileData?.employee_type || selectedEmployee?.employeeType,
        effective_date: assignForm.effective_date,
        ctc: parseFloat(assignForm.ctc),
        basic_percent: parseFloat(assignForm.basic_percent),
        hra_percent: parseFloat(assignForm.hra_percent),
        da_percent: parseFloat(assignForm.da_percent),
        pf_percent: parseFloat(assignForm.pf_percent),
        esi_percent: parseFloat(assignForm.esi_percent),
        transport: parseFloat(assignForm.transport),
        medical: parseFloat(assignForm.medical),
        other_allowance: parseFloat(assignForm.other_allowance),
        pt: parseFloat(assignForm.pt),
        is_metro: assignForm.is_metro,
      });
      if (res.data?.id) {
        toast.success('Salary structure configured.');
      }
      setShowAssignModal(false);
      await loadData(true);
    } catch (err) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Structure setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMetroToggle = (metroVal: boolean) => {
    setAssignForm((p) => ({
      ...p,
      is_metro: metroVal,
      hra_percent: String(metroVal ? settingsDefaults.hra_percent_metro || 50 : settingsDefaults.hra_percent_nonmetro || 40),
    }));
  };

  const openAssignSalary = () => {
    setAssignForm((p) => ({
      ...p,
      employee: '',
      effective_date: new Date().toISOString().split('T')[0],
      ctc: '',
      basic_percent: String(settingsDefaults.basic_percent ?? 40),
      hra_percent: String(settingsDefaults.hra_percent_metro ?? 50),
      da_percent: String(settingsDefaults.da_percent ?? 10),
      pf_percent: String(settingsDefaults.pf_employee_percent ?? 12),
      esi_percent: String(settingsDefaults.esi_employee_percent ?? 0.75),
      transport: String(settingsDefaults.default_transport ?? 1600),
      medical: String(settingsDefaults.default_medical ?? 1250),
      other_allowance: String(settingsDefaults.default_other_allowance ?? 0),
      pt: String(settingsDefaults.default_pt ?? 200),
      is_metro: true,
    }));
    setShowAssignModal(true);
  };

  const filteredStructures = useMemo(() => {
    if (!empFilter) return salaryStructuresList;
    const selectedEmployee = employees.find((emp) => javaUserId(emp) === empFilter);
    const selectedEmail = selectedEmployee ? javaUserEmail(selectedEmployee).toLowerCase() : '';
    return salaryStructuresList.filter((s) => (
      String(s.employee_id || s.employee) === empFilter ||
      (!!selectedEmail && String(s.employee_email || '').toLowerCase() === selectedEmail)
    ));
  }, [salaryStructuresList, empFilter, employees]);

  // Runs Statistics
  const runTotals = useMemo(() => {
    if (!activeRunDetail) return null;
    return activeRunDetail.entries.reduce(
      (s, e) => ({
        gross: s.gross + n(e.gross),
        net: s.net + n(e.net_pay),
        pf: s.pf + n(e.pf_employee),
        esi: s.esi + n(e.esi_employee),
        pt: s.pt + n(e.pt),
        tds: s.tds + n(e.tds),
        lop: s.lop + n(e.lop_deduction),
        ot_pay: s.ot_pay + n(e.ot_pay),
        extra: s.extra + n(e.extra_work_pay),
      }),
      { gross: 0, net: 0, pf: 0, esi: 0, pt: 0, tds: 0, lop: 0, ot_pay: 0, extra: 0 }
    );
  }, [activeRunDetail]);

  const activeEmployeesList = useMemo(() => {
    if (!activeRunDetail) return [];
    return employees.map((javaUser) => {
      const jEmail = javaUserEmail(javaUser).toLowerCase();
      const jName = javaUserName(javaUser);
      const jCode = javaUserEmpCode(javaUser);
      const jId = javaUserId(javaUser);

      const structure = salaryStructuresList.find((s) => (
        String(s.employee_id || s.employee) === jId ||
        (!!jEmail && String(s.employee_email || '').toLowerCase() === jEmail)
      ));

      const djangoEmp = activeRunDetail.available_employees?.find((e) => (
        (structure && String(e.id) === String(structure.employee || structure.employee_id)) ||
        (e.name === jName) ||
        (!!jCode && e.emp_code === jCode)
      ));

      const processed = djangoEmp?.processed || activeRunDetail.entries.some((entry) => (
        (structure && String(entry.employee_id) === String(structure.employee || structure.employee_id)) ||
        (entry.employee_name === jName) ||
        (!!jCode && entry.emp_code === jCode)
      ));

      const hasSalary = !!structure || !!djangoEmp?.has_salary;
      const djangoId = djangoEmp?.id || structure?.employee || structure?.employee_id || jId;

      return {
        id: djangoId,
        name: jName,
        emp_code: jCode || djangoEmp?.emp_code || '',
        has_salary: hasSalary,
        processed: processed,
      };
    });
  }, [activeRunDetail, employees, salaryStructuresList]);
  const unprocessedEmployees = activeEmployeesList.filter((e) => !e.processed && e.has_salary);
  const canRunBatch = activeRunDetail?.run.status !== 'locked' && (
    processEmployeeId !== 'all' ||
    unprocessedEmployees.length > 0 ||
    (activeRunDetail?.entries?.length || 0) > 0
  );
  const batchActionLabel =
    processEmployeeId === 'all' && unprocessedEmployees.length === 0 && (activeRunDetail?.entries?.length || 0) > 0
      ? 'Reprocess Batch'
      : processEmployeeId === 'all'
        ? 'Process Batch'
        : 'Process User';

  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalNode(document.getElementById('hrms-header-portal'));
  }, []);

  const headerContent = (
    <PageHeader
      title="HRMS Payroll Operations"
      description="Access payslips, check salary structures, compute monthly payroll registers, and review statutory compliance deductions."
    />
  );

  return (
    <div className="space-y-6">
      {portalNode ? createPortal(headerContent, portalNode) : headerContent}

      {/* Tabs list */}
      <div className="flex p-1 bg-muted rounded-xl w-fit border border-border">
        <button
          onClick={() => setTab('payslips')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95',
            tab === 'payslips' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          📄 My Payslips
        </button>
        <button
          onClick={() => setTab('salary')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95',
            tab === 'salary' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          💼 My Salary structure
        </button>
        {(canProcess || canManage) && (
          <>
            <button
              onClick={() => setTab('runs')}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95',
                tab === 'runs' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              ⚙️ Payroll Runs
            </button>
            <button
              onClick={() => setTab('config')}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95',
                tab === 'config' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              📐 Salary Configuration
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* TAB 1: MY PAYSLIPS */}
          {tab === 'payslips' && (
            <div className="space-y-6">
              {/* YTD Summary Tiles */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Year-to-Date (YTD) Summary</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
                    <p className="text-blue-400 font-bold text-sm">{fmt(ytdSummary.gross)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">YTD Gross</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1">
                    <p className="text-purple-400 font-bold text-sm">{fmt(ytdSummary.ot_pay)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">OT Paid</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                    <p className="text-emerald-400 font-bold text-sm">{fmt(ytdSummary.net)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">YTD Net</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-1">
                    <p className="text-cyan-400 font-bold text-sm">{fmt(ytdSummary.pf)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">YTD PF</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-1">
                    <p className="text-cyan-400 font-bold text-sm">{fmt(ytdSummary.esi)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">YTD ESI</p>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
                    <p className="text-red-400 font-bold text-sm">{fmt(ytdSummary.tds)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">YTD TDS</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-1">
                    <p className="text-orange-400 font-bold text-sm">{fmt(ytdSummary.lop)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">LOP Deducted</p>
                  </div>
                </div>
              </div>

              {/* List */}
              {payslips.length === 0 ? (
                <Card className="text-center p-12 text-xs text-muted-foreground border-dashed">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold text-foreground text-sm">No Payslips Released</p>
                  <p className="mt-1">Your monthly payslip reports will appear here once finalized by HR.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {payslips.map((p) => {
                    const runMonth = p.payroll_run?.month;
                    const runYear = p.payroll_run?.year;
                    const label = runMonth ? `${MONTH_NAMES[runMonth]} ${runYear}` : 'Monthly Payslip';
                    const isLop = n(p.lop_days) > 0;
                    const isOt = n(p.ot_hours) > 0;

                    return (
                      <Card
                        key={p.id}
                        onClick={() => setSelectedPayslip(p)}
                        className="cursor-pointer hover:bg-muted/10 border border-border hover:border-primary/20 transition-all text-xs"
                      >
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 border text-primary flex items-center justify-center rounded-xl font-bold">
                              📄
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-foreground text-sm">{label}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-muted-foreground">{fmtD(p.present_days)} present days</span>
                                {isLop && <Badge variant="destructive" className="text-[9px] py-0 px-1.5">LOP: {fmtD(p.lop_days)} days</Badge>}
                                {isOt && <Badge variant="warning" className="text-[9px] py-0 px-1.5">OT: {fmtD(p.ot_hours)}h</Badge>}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6 md:justify-end text-right">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Gross Earnings</p>
                              <p className="font-bold text-foreground">{fmt(p.gross)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Deductions</p>
                              <p className="font-bold text-red-500">{fmt(p.total_deductions)}</p>
                            </div>
                            <div className="p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-center">
                              <p className="text-[10px] text-emerald-500 uppercase font-bold">Net Pay</p>
                              <p className="font-bold text-emerald-400 text-sm">{fmt(p.net_pay)}</p>
                            </div>
                            <span className="text-primary font-bold hidden md:block">View & Print →</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY SALARY DETAILS */}
          {tab === 'salary' && (
            <div className="space-y-6">
              {!salaryStructure ? (
                <Card className="text-center p-12 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground text-sm">No Salary Configured</p>
                  <p className="mt-1">Contact your Administrator to configure your salary parameters.</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/20 rounded-2xl flex-wrap gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Total Yearly CTC Structure</p>
                      <h2 className="text-2xl font-black text-white">{fmt(salaryStructure.ctc)}</h2>
                      <p className="text-xs text-muted-foreground">Effective Date: {salaryStructure.effective_date}</p>
                    </div>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-right">
                      <p className="text-[10px] text-emerald-500 font-bold uppercase">Base Net Pay / Month</p>
                      <p className="text-xl font-bold text-emerald-400">{fmt(salaryStructure.net_pay)}</p>
                      <p className="text-[9px] text-muted-foreground">Prorated before taxes and LOPs</p>
                    </div>
                  </div>

                  {/* Overtime rate details */}
                  <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl flex items-center gap-3 text-xs">
                    <span className="text-lg">⏱</span>
                    <div>
                      <p className="text-purple-400 font-bold">
                        Calculated Overtime Rate: {fmt((salaryStructure.gross / (settingsDefaults.working_days_per_month || 22) / 8) * (settingsDefaults.overtime_multiplier || 1.5))}/hr
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Formulated as: (Gross Salary / {settingsDefaults.working_days_per_month || 22} workdays / 8 shift hours) x {settingsDefaults.overtime_multiplier || 1.5} multiplier
                      </p>
                    </div>
                  </div>

                  {/* Breakdown columns */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Earnings List</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        <div className="flex justify-between py-1.5 border-b">
                          <span className="text-muted-foreground">Basic Pay</span>
                          <span className="font-semibold">{fmt(salaryStructure.basic)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                          <span className="text-muted-foreground">HRA Allowance</span>
                          <span className="font-semibold">{fmt(salaryStructure.hra)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                          <span className="text-muted-foreground">Dearness Allowance (DA)</span>
                          <span className="font-semibold">{fmt(salaryStructure.da)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                          <span className="text-muted-foreground">Special Allowance</span>
                          <span className="font-semibold">{fmt(salaryStructure.special_allowance)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 font-bold pt-3 border-t text-sm">
                          <span className="text-foreground">Monthly Gross Salary</span>
                          <span className="text-blue-400">{fmt(salaryStructure.gross)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Standard Monthly Deductions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        <div className="flex justify-between py-1.5 border-b">
                          <span className="text-muted-foreground">PF (Provident Fund)</span>
                          <span className="font-semibold text-purple-400">{fmt(salaryStructure.pf_employee)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                          <span className="text-muted-foreground">ESI (Health Insurance)</span>
                          <span className="font-semibold text-blue-400">{fmt(salaryStructure.esi_employee)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                          <span className="text-muted-foreground">Professional Tax (PT)</span>
                          <span className="font-semibold text-cyan-400">{fmt(salaryStructure.pt)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 font-bold pt-3 border-t text-sm">
                          <span className="text-foreground">Total Deductions</span>
                          <span className="text-red-500">{fmt(salaryStructure.pf_employee + salaryStructure.esi_employee + salaryStructure.pt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYROLL RUNS */}
          {tab === 'runs' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Run Creator */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generate Payroll Run</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateRun} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-muted-foreground">Target Month</label>
                          <select
                            value={newRunForm.month}
                            onChange={(e) => setNewRunForm((p) => ({ ...p, month: parseInt(e.target.value) }))}
                            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                          >
                            {MONTH_SHORT.slice(1).map((m, idx) => (
                              <option key={m} value={idx + 1}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-muted-foreground">Target Year</label>
                          <Input
                            type="number"
                            value={newRunForm.year}
                            onChange={(e) => setNewRunForm((p) => ({ ...p, year: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">Split Start Date (Optional)</label>
                        <Input
                          type="date"
                          value={newRunForm.period_start}
                          onChange={(e) => setNewRunForm((p) => ({ ...p, period_start: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">Split End Date (Optional)</label>
                        <Input
                          type="date"
                          value={newRunForm.period_end}
                          onChange={(e) => setNewRunForm((p) => ({ ...p, period_end: e.target.value }))}
                        />
                      </div>

                      <Button type="submit" disabled={submitting} className="w-full">
                        {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Generate Run
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Runs list */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Payroll Runs</p>
                  {runs.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground border rounded-xl border-dashed">
                      No payroll runs created.
                    </div>
                  ) : (
                    runs.map((r) => {
                      const active = selectedRun?.id === r.id;
                      const st = STATUS_STYLE[r.status] || STATUS_STYLE.draft;

                      return (
                        <Card
                          key={r.id}
                          onClick={() => handleSelectRun(r)}
                          className={cn(
                            'cursor-pointer border hover:border-primary/20 transition-all text-xs',
                            active && 'border-primary ring-1 ring-primary'
                          )}
                        >
                          <CardContent className="p-3.5 flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-bold text-foreground text-sm">
                                {MONTH_SHORT[r.month]} {r.year}
                              </p>
                              {r.period_start && (
                                <p className="text-[10px] text-muted-foreground">
                                  {r.period_start} to {r.period_end}
                                </p>
                              )}
                            </div>

                            <div className="text-right space-y-1">
                              <Badge className={cn('text-[9px] py-0 px-2 uppercase', st.bg)}>{r.status}</Badge>
                              {r.total_net_pay !== undefined && <p className="font-bold text-emerald-400">{fmt(r.total_net_pay)}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Detail view register panel */}
              <div className="lg:col-span-2 space-y-6">
                {!selectedRun || !activeRunDetail ? (
                  <Card className="text-center p-20 text-xs text-muted-foreground border-dashed h-full flex flex-col justify-center items-center">
                    <Settings2 className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="font-semibold text-foreground text-sm">No Run Selected</p>
                    <p className="mt-1">Click any run from the list to process records or add adjustments.</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Header */}
                    <Card>
                      <CardContent className="p-5 space-y-4 text-xs">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <h3 className="font-bold text-base text-foreground">
                              {MONTH_NAMES[activeRunDetail.run.month]} {activeRunDetail.run.year} Payroll Registry
                            </h3>
                            <p className="text-muted-foreground">
                              {activeRunDetail.entries.length} entries · Status: <span className="font-bold uppercase text-foreground">{activeRunDetail.run.status}</span>
                            </p>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {activeRunDetail.run.status !== 'locked' && (
                              <>
                                <select
                                  value={processEmployeeId}
                                  onChange={(e) => setProcessEmployeeId(e.target.value)}
                                  className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                                >
                                  <option value="all">Remaining ({unprocessedEmployees.length})</option>
                                  {activeEmployeesList.map((emp) => (
                                    <option key={emp.id} value={emp.id} disabled={emp.processed || !emp.has_salary}>
                                      {emp.name} {emp.processed ? '(Processed)' : !emp.has_salary ? '(No salary)' : ''}
                                    </option>
                                  ))}
                                </select>

                                <Button
                                  variant="secondary"
                                  onClick={handleProcessRun}
                                  disabled={submitting || !canRunBatch}
                                >
                                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                  {batchActionLabel}
                                </Button>
                              </>
                            )}

                            {canApprove && activeRunDetail.run.status === 'processed' && (
                              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApproveRun} disabled={submitting}>
                                Approve & Lock Register
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Totals Summary */}
                        {runTotals && (
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5 pt-4 border-t">
                            <div className="p-2 bg-muted/30 rounded-lg">
                              <p className="text-[10px] text-muted-foreground uppercase">Gross total</p>
                              <p className="font-bold text-foreground">{fmt(runTotals.gross)}</p>
                            </div>
                            <div className="p-2 bg-muted/30 rounded-lg">
                              <p className="text-[10px] text-muted-foreground uppercase">PF Employee</p>
                              <p className="font-bold text-purple-400">{fmt(runTotals.pf)}</p>
                            </div>
                            <div className="p-2 bg-muted/30 rounded-lg">
                              <p className="text-[10px] text-muted-foreground uppercase">TDS slab</p>
                              <p className="font-bold text-red-500">{fmt(runTotals.tds)}</p>
                            </div>
                            <div className="p-2 bg-muted/30 rounded-lg">
                              <p className="text-[10px] text-muted-foreground uppercase">LOP total</p>
                              <p className="font-bold text-orange-400">{fmt(runTotals.lop)}</p>
                            </div>
                            <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                              <p className="text-[10px] text-emerald-500 uppercase font-bold">Net Total</p>
                              <p className="font-bold text-emerald-400">{fmt(runTotals.net)}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Entries Register Table */}
                    <Card>
                      <CardHeader className="py-3.5 border-b">
                        <CardTitle className="text-sm">Employee Pay Registers</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-xs text-left min-w-[700px]">
                          <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px]">
                            <tr>
                              <th className="p-3">Employee</th>
                              <th className="p-3">Present/Workdays</th>
                              <th className="p-3">Gross Salary</th>
                              <th className="p-3">Total Deductions</th>
                              <th className="p-3">Net Takehome</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeRunDetail.entries.map((entry) => {
                              const isExpanded = expandEntryId === entry.id;
                              const isLop = n(entry.lop_days) > 0;

                              return (
                                <>
                                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/5">
                                    <td className="p-3">
                                      <p className="font-bold text-foreground text-sm">{entry.employee_name}</p>
                                      <p className="text-[10px] text-muted-foreground">{entry.emp_code} • {entry.department}</p>
                                    </td>
                                    <td className="p-3">
                                      <p className="font-bold">{fmtD(entry.present_days)} / {entry.working_days} days</p>
                                      {isLop && <span className="text-[9px] text-orange-400 font-medium">⚡ {fmtD(entry.lop_days)} LOP</span>}
                                    </td>
                                    <td className="p-3 font-semibold text-blue-400">{fmt(entry.gross)}</td>
                                    <td className="p-3 font-semibold text-red-500">-{fmt(entry.total_deductions)}</td>
                                    <td className="p-3 font-bold text-emerald-400">{fmt(entry.net_pay)}</td>
                                    <td className="p-3 text-right space-x-1.5">
                                      {activeRunDetail.run.status !== 'locked' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-[10px]"
                                          onClick={() => {
                                            setAdjEntry(entry);
                                            setAdjForm({ type: 'bonus', amount: '', reason: '' });
                                          }}
                                        >
                                          + Adj
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-primary text-[10px]"
                                        onClick={() => setExpandEntryId(isExpanded ? null : entry.id)}
                                      >
                                        {isExpanded ? 'Hide' : 'Details'}
                                      </Button>
                                    </td>
                                  </tr>
                                  {isExpanded && (
                                    <tr className="border-b bg-muted/10">
                                      <td colSpan={6} className="p-4">
                                        <div className="grid gap-4 md:grid-cols-3">
                                          <div className="rounded-lg border bg-background p-3">
                                            <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Attendance Basis</p>
                                            <div className="space-y-1 text-[11px]">
                                              <div className="flex justify-between"><span>Calendar days</span><strong>{entry.attendance_breakdown?.total_days ?? entry.working_days}</strong></div>
                                              <div className="flex justify-between"><span>Working days</span><strong>{entry.attendance_breakdown?.working_days ?? entry.working_days}</strong></div>
                                              <div className="flex justify-between"><span>Paid present days</span><strong>{fmtD(entry.attendance_breakdown?.present_days ?? entry.present_days)}</strong></div>
                                              <div className="flex justify-between text-orange-400"><span>LOP days</span><strong>{fmtD(entry.attendance_breakdown?.lop_days ?? entry.lop_days)}</strong></div>
                                              <div className="flex justify-between"><span>Holidays</span><strong>{entry.attendance_breakdown?.holiday_count ?? entry.holiday_count}</strong></div>
                                              <div className="flex justify-between"><span>OT hours</span><strong>{fmtD(entry.attendance_breakdown?.ot_hours ?? entry.ot_hours)}</strong></div>
                                              <div className="flex justify-between"><span>Extra work days</span><strong>{fmtD(entry.attendance_breakdown?.extra_work_days ?? entry.extra_work_days)}</strong></div>
                                              <div className="flex justify-between"><span>Comp-off adjusted</span><strong>{fmtD(entry.attendance_breakdown?.comp_off_days ?? entry.comp_off_days)}</strong></div>
                                            </div>
                                          </div>

                                          <div className="rounded-lg border bg-background p-3">
                                            <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Earnings</p>
                                            <div className="space-y-1 text-[11px]">
                                              {moneyRows(entry.earnings_breakdown, [
                                                ['basic', 'Basic'],
                                                ['hra', 'HRA'],
                                                ['da', 'DA'],
                                                ['special_allowance', 'Special allowance'],
                                                ['transport', 'Transport'],
                                                ['medical', 'Medical'],
                                                ['other_allowance', 'Other allowance'],
                                                ['ot_pay', 'OT pay'],
                                                ['extra_work_pay', 'Extra work pay'],
                                                ['adjustment_credits', 'Adjustment credits'],
                                              ]).map((row) => (
                                                <div key={row.key} className="flex justify-between"><span>{row.label}</span><strong>{fmt(row.value)}</strong></div>
                                              ))}
                                              <div className="flex justify-between border-t pt-1 text-blue-400"><span>Gross</span><strong>{fmt(entry.gross)}</strong></div>
                                            </div>
                                          </div>

                                          <div className="rounded-lg border bg-background p-3">
                                            <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Deductions & Net</p>
                                            <div className="space-y-1 text-[11px]">
                                              {moneyRows(entry.deductions_breakdown, [
                                                ['pf_employee', 'PF employee'],
                                                ['esi_employee', 'ESI employee'],
                                                ['pt', 'Professional tax'],
                                                ['tds', 'TDS'],
                                                ['lop_deduction', 'LOP deduction'],
                                                ['adjustment_deductions', 'Adjustment deductions'],
                                              ]).map((row) => (
                                                <div key={row.key} className="flex justify-between text-red-400"><span>{row.label}</span><strong>-{fmt(row.value)}</strong></div>
                                              ))}
                                              <div className="flex justify-between border-t pt-1 text-red-500"><span>Total deductions</span><strong>-{fmt(entry.total_deductions)}</strong></div>
                                              <div className="flex justify-between rounded-md bg-emerald-500/10 p-2 text-emerald-400"><span>Net payable</span><strong>{fmt(entry.net_pay)}</strong></div>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SALARY CONFIGURATIONS */}
          {tab === 'config' && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <CardTitle className="text-base">Employee Base Structures</CardTitle>
                  <Button size="sm" onClick={openAssignSalary} className="flex items-center gap-1.5">
                    <Plus className="h-4 w-4" />
                    Assign Salary Structure
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Search and Filters */}
                  <div className="flex gap-3 max-w-sm">
                    <select
                      value={empFilter}
                      onChange={(e) => setEmpFilter(e.target.value)}
                      className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none w-full"
                    >
                      <option value="">Filter by Employee</option>
                      {employees.map((e) => (
                        <option key={javaUserId(e)} value={javaUserId(e)}>
                          {javaUserName(e)} ({javaUserEmpCode(e) || javaUserEmail(e)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* List Structures */}
                  {filteredStructures.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground">
                      No structures found matching filter.
                    </div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-muted/40 border-b font-semibold uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Employee</th>
                            <th className="p-3">Effective Date</th>
                            <th className="p-3">CTC (Yearly)</th>
                            <th className="p-3">Basic (Monthly)</th>
                            <th className="p-3">HRA (Monthly)</th>
                            <th className="p-3">Gross Salary</th>
                            <th className="p-3">Deductions</th>
                            <th className="p-3">Base Takehome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStructures.map((s) => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-muted/5">
                              <td className="p-3">
                                <p className="font-bold text-foreground">{s.employee_name}</p>
                                <p className="text-[10px] text-muted-foreground">{s.emp_code}</p>
                              </td>
                              <td className="p-3">{s.effective_date}</td>
                              <td className="p-3">{fmt(s.ctc)}</td>
                              <td className="p-3">{fmt(s.basic)}</td>
                              <td className="p-3">{fmt(s.hra)}</td>
                              <td className="p-3 text-blue-400 font-semibold">{fmt(s.gross)}</td>
                              <td className="p-3 text-red-500 font-semibold">
                                <div>{fmt(s.total_deductions || s.deductions_breakdown?.total_deductions || 0)}</div>
                                <div className="text-[9px] text-muted-foreground">
                                  PF {fmt(s.pf_employee)} · ESI {fmt(s.esi_employee)} · PT {fmt(s.pt)}
                                </div>
                              </td>
                              <td className="p-3 text-emerald-400 font-bold bg-emerald-500/5 border-l-2 border-emerald-500/20">
                                {fmt(s.net_pay)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* PAYSLIP MODAL DIALOG PREVIEW */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-base">Payslip Sheet Preview</CardTitle>
              <button onClick={() => setSelectedPayslip(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 max-h-[80vh] overflow-y-auto print:max-h-none text-xs">
              <div id="print-sheet" className="p-6 bg-background border rounded-xl space-y-6 text-slate-100">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-50">UNIVERSAL SAAS HRM</h2>
                    <p className="text-[10px] text-slate-400">Release Sheet Document</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase">Released payslip</p>
                    <p className="font-bold text-slate-200">
                      Month: {selectedPayslip.payroll_run?.month ? MONTH_NAMES[selectedPayslip.payroll_run.month] : 'Monthly'}
                    </p>
                    <p className="text-[9px] text-slate-400">Year: {selectedPayslip.payroll_run?.year || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Employee</span>
                    <p className="font-bold text-slate-200">{selectedPayslip.employee_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Emp Code</span>
                    <p className="font-bold text-slate-200">{selectedPayslip.emp_code || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Working days</span>
                    <p className="font-bold text-slate-200">{selectedPayslip.working_days} days</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">LOP Days</span>
                    <p className="font-bold text-red-400">{fmtD(selectedPayslip.lop_days)} days</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Earnings Breakdown</p>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span>Basic Pay</span>
                        <span>{fmt(selectedPayslip.basic)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span>HRA</span>
                        <span>{fmt(selectedPayslip.hra)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span>DA</span>
                        <span>{fmt(selectedPayslip.da)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span>Special Allowance</span>
                        <span>{fmt(selectedPayslip.special_allowance)}</span>
                      </div>
                      {n(selectedPayslip.ot_pay) > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-900 text-purple-400 font-semibold">
                          <span>Overtime Pay ({fmtD(selectedPayslip.ot_hours)}h)</span>
                          <span>{fmt(selectedPayslip.ot_pay)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 font-bold border-t border-slate-800 text-blue-400 pt-2">
                        <span>Gross Earnings</span>
                        <span>{fmt(selectedPayslip.gross)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Deductions Breakdown</p>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-900 text-purple-300">
                        <span>PF Employee Share</span>
                        <span>-{fmt(selectedPayslip.pf_employee)}</span>
                      </div>
                      {n(selectedPayslip.esi_employee) > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-900 text-blue-300">
                          <span>ESI Employee Share</span>
                          <span>-{fmt(selectedPayslip.esi_employee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-b border-slate-900 text-cyan-300">
                        <span>Professional Tax (PT)</span>
                        <span>-{fmt(selectedPayslip.pt)}</span>
                      </div>
                      {n(selectedPayslip.tds) > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-900 text-red-400">
                          <span>TDS deducted</span>
                          <span>-{fmt(selectedPayslip.tds)}</span>
                        </div>
                      )}
                      {n(selectedPayslip.lop_deduction) > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-900 text-orange-400 font-semibold">
                          <span>Loss of Pay (LOP)</span>
                          <span>-{fmt(selectedPayslip.lop_deduction)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 font-bold border-t border-slate-800 text-red-400 pt-2">
                        <span>Total Deductions</span>
                        <span>-{fmt(selectedPayslip.total_deductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase">Net takehome payout</p>
                    <p className="text-2xl font-black text-emerald-400">{fmt(selectedPayslip.net_pay)}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-[280px]">
                    Released base takehome salary structure calculated using live attendance records.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" className="flex items-center gap-1.5" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print Sheet
                </Button>
                <Button onClick={() => setSelectedPayslip(null)}>Close Preview</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ADJUSTMENTS DIALOG MODAL */}
      {adjEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-base">Add Adjustment Entry</CardTitle>
              <button onClick={() => setAdjEntry(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleAddAdjustment} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Adjustment Type</label>
                  <select
                    value={adjForm.type}
                    onChange={(e) => setAdjForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="bonus">🎁 Bonus Reward</option>
                    <option value="reimbursement">🧾 Reimbursement Credit</option>
                    <option value="arrear">📅 Arrears Adjustment</option>
                    <option value="deduction">➖ LOP / Penalties Deduction</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Adjust Amount (₹) *</label>
                  <Input
                    type="number"
                    value={adjForm.amount}
                    onChange={(e) => setAdjForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="e.g. 5000"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Reason / feedback justification *</label>
                  <textarea
                    value={adjForm.reason}
                    onChange={(e) => setAdjForm((p) => ({ ...p, reason: e.target.value }))}
                    rows={3}
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    placeholder="Provide justification reason details..."
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setAdjEntry(null)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    Add Adjustment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ASSIGN SALARY DIALOG MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base">Assign Salary Structure Parameters</CardTitle>
                <p className="text-[10px] text-primary mt-0.5">Parameters are auto-filled from current system settings defaults.</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleAssignSalary} className="grid md:grid-cols-3 gap-6 text-xs">
                {/* Form Fields */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Select Employee *</label>
                      <select
                        value={assignForm.employee}
                        onChange={(e) => setAssignForm((p) => ({ ...p, employee: e.target.value }))}
                        className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                        required
                      >
                        <option value="">Choose employee...</option>
                        {employees.map((e) => (
                          <option key={javaUserId(e)} value={javaUserId(e)}>
                            {javaUserName(e)} ({javaUserEmpCode(e) || javaUserEmail(e)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Effective Date *</label>
                      <Input
                        type="date"
                        value={assignForm.effective_date}
                        onChange={(e) => setAssignForm((p) => ({ ...p, effective_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Annual CTC Amount (₹) *</label>
                    <Input
                      type="number"
                      value={assignForm.ctc}
                      onChange={(e) => setAssignForm((p) => ({ ...p, ctc: e.target.value }))}
                      placeholder="e.g. 600000"
                      required
                    />
                  </div>

                  {/* Metro Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-muted-foreground">Location type:</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={assignForm.is_metro ? 'default' : 'outline'}
                        onClick={() => handleMetroToggle(true)}
                        className="h-8"
                      >
                        Metro (HRA {settingsDefaults.hra_percent_metro || 50}%)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!assignForm.is_metro ? 'default' : 'outline'}
                        onClick={() => handleMetroToggle(false)}
                        className="h-8"
                      >
                        Non-Metro (HRA {settingsDefaults.hra_percent_nonmetro || 40}%)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3.5 border-t pt-4">
                    <p className="font-bold text-muted-foreground uppercase text-[10px]">Proration percentages</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">Basic % of CTC</label>
                        <Input
                          type="number"
                          value={assignForm.basic_percent}
                          onChange={(e) => setAssignForm((p) => ({ ...p, basic_percent: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">HRA % of Basic</label>
                        <Input
                          type="number"
                          value={assignForm.hra_percent}
                          onChange={(e) => setAssignForm((p) => ({ ...p, hra_percent: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">DA % of Basic</label>
                        <Input
                          type="number"
                          value={assignForm.da_percent}
                          onChange={(e) => setAssignForm((p) => ({ ...p, da_percent: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 border-t pt-4">
                    <p className="font-bold text-muted-foreground uppercase text-[10px]">Fixed Monthly Allowances (₹)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">Transport</label>
                        <Input
                          type="number"
                          value={assignForm.transport}
                          onChange={(e) => setAssignForm((p) => ({ ...p, transport: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">Medical</label>
                        <Input
                          type="number"
                          value={assignForm.medical}
                          onChange={(e) => setAssignForm((p) => ({ ...p, medical: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">Other allowance</label>
                        <Input
                          type="number"
                          value={assignForm.other_allowance}
                          onChange={(e) => setAssignForm((p) => ({ ...p, other_allowance: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview Side panel */}
                <div className="p-4 bg-muted/40 border rounded-xl space-y-4">
                  <p className="font-bold text-muted-foreground uppercase text-[10px]">Live Monthly preview</p>
                  {assignPreview ? (
                    <div className="space-y-3">
                      <div className="space-y-1 pb-2 border-b">
                        <p className="text-[10px] text-muted-foreground uppercase">Estimated monthly gross</p>
                        <p className="text-base font-bold text-foreground">{fmt(assignPreview.gross)}</p>
                      </div>

                      <div className="space-y-1 pb-2 border-b">
                        <p className="text-[10px] text-muted-foreground uppercase">Basic Salary</p>
                        <p className="font-semibold text-foreground">{fmt(assignPreview.basic)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg border bg-background/70 p-2">
                          <span className="text-muted-foreground">HRA</span>
                          <p className="font-semibold">{fmt(assignPreview.hra)}</p>
                        </div>
                        <div className="rounded-lg border bg-background/70 p-2">
                          <span className="text-muted-foreground">DA</span>
                          <p className="font-semibold">{fmt(assignPreview.da)}</p>
                        </div>
                        <div className="rounded-lg border bg-background/70 p-2">
                          <span className="text-muted-foreground">Special</span>
                          <p className="font-semibold">{fmt(assignPreview.special)}</p>
                        </div>
                        <div className="rounded-lg border bg-background/70 p-2">
                          <span className="text-muted-foreground">Allowances</span>
                          <p className="font-semibold">{fmt(assignPreview.transport + assignPreview.medical + assignPreview.other)}</p>
                        </div>
                      </div>

                      <div className="space-y-1 pb-2 border-b">
                        <p className="text-[10px] text-purple-400 uppercase">PF employee</p>
                        <p className="font-semibold text-purple-400">-{fmt(assignPreview.pf_emp)}</p>
                      </div>

                      <div className="space-y-1 pb-2 border-b">
                        <p className="text-[10px] text-blue-400 uppercase">ESI Employee</p>
                        <p className="font-semibold text-blue-400">
                          {assignPreview.esi_exempt ? 'Exempt' : `-${fmt(assignPreview.esi_emp)}`}
                        </p>
                      </div>

                      <div className="space-y-1 pb-2 border-b">
                        <p className="text-[10px] text-cyan-400 uppercase">Professional Tax</p>
                        <p className="font-semibold text-cyan-400">-{fmt(assignPreview.pt)}</p>
                      </div>

                      <div className="space-y-1 pb-2 border-b">
                        <p className="text-[10px] text-red-400 uppercase">Total Deductions</p>
                        <p className="font-semibold text-red-400">-{fmt(assignPreview.total_deductions)}</p>
                      </div>

                      <div className="space-y-1.5 p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
                        <p className="text-[9px] text-emerald-500 font-bold uppercase">Net pay per month</p>
                        <p className="text-xl font-black text-emerald-400">{fmt(assignPreview.net)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Enter CTC amount to calculate preview parameters.</p>
                  )}
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    Assign Structure
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PayrollPage;